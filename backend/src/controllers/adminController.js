const prisma = require('../lib/prisma');

const getAllRides = async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      userId, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (status) where.status = status;
    if (userId) where.userId = userId;
    
    if (startDate || endDate) {
      where.scheduledTime = {};
      if (startDate) where.scheduledTime.gte = new Date(startDate);
      if (endDate) where.scheduledTime.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { pickupLocation: { contains: search, mode: 'insensitive' } },
        { dropLocation: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { company: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          },
          adminActions: {
            include: {
              admin: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { scheduledTime: 'desc' }
      }),
      prisma.ride.count({ where })
    ]);

    res.json({
      rides,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all rides error:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
};

const approveRejectRide = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const rideId = req.params.id;

    // Check if ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Check if ride can be acted upon
    if (ride.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only approve/reject pending rides' });
    }

    // Determine new status based on action
    let newStatus;
    switch (action) {
      case 'APPROVE':
        newStatus = 'APPROVED';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
      case 'CANCEL':
        newStatus = 'CANCELLED';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Use transaction to update ride and create admin action
    const result = await prisma.$transaction(async (tx) => {
      // Update ride status
      const updatedRide = await tx.ride.update({
        where: { id: rideId },
        data: { status: newStatus },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          }
        }
      });

      // Create admin action record
      await tx.adminAction.create({
        data: {
          adminId: req.user.id,
          rideId: rideId,
          action: action,
          reason: reason || null
        }
      });

      return updatedRide;
    });

    res.json({
      message: `Ride ${action.toLowerCase()}d successfully`,
      ride: result
    });
  } catch (error) {
    console.error('Approve/reject ride error:', error);
    res.status(500).json({ error: 'Failed to process ride action' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter for rides - convert local dates to UTC
    const rideDateFilter = {};
    if (startDate || endDate) {
      try {
        rideDateFilter.scheduledTime = {};
        if (startDate) {
          const localDate = new Date(startDate + 'T00:00:00');
          rideDateFilter.scheduledTime.gte = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
        }
        if (endDate) {
          const localDate = new Date(endDate + 'T23:59:59.999');
          rideDateFilter.scheduledTime.lte = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    }

    // Build date filter for admin actions - convert local dates to UTC
    const actionDateFilter = {};
    if (startDate || endDate) {
      try {
        actionDateFilter.createdAt = {};
        if (startDate) {
          const localDate = new Date(startDate + 'T00:00:00');
          actionDateFilter.createdAt.gte = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
        }
        if (endDate) {
          const localDate = new Date(endDate + 'T23:59:59.999');
          actionDateFilter.createdAt.lte = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    }

    // Get total rides
    const totalRides = await prisma.ride.count({ where: rideDateFilter });

    // Get rides by status
    const ridesByStatus = await prisma.ride.groupBy({
      by: ['status'],
      where: rideDateFilter,
      _count: { status: true }
    });

    // Get rides per day (last 30 days if no date range)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all rides in the date range with proper timezone handling
    const ridesInRange = await prisma.ride.findMany({
      where: {
        scheduledTime: {
          gte: startDate ? 
            new Date(new Date(startDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTimezoneOffset() * 60000) : 
            thirtyDaysAgo,
          ...(endDate && { 
            lte: new Date(new Date(endDate + 'T23:59:59.999').getTime() - new Date(endDate + 'T23:59:59.999').getTimezoneOffset() * 60000) 
          })
        }
      },
      select: {
        scheduledTime: true
      },
      orderBy: {
        scheduledTime: 'desc'
      }
    });

    // Group rides by date and count them
    const ridesPerDayMap = {};
    ridesInRange.forEach(ride => {
      const dateKey = ride.scheduledTime.toISOString().split('T')[0];
      ridesPerDayMap[dateKey] = (ridesPerDayMap[dateKey] || 0) + 1;
    });

    // Convert to array and sort by date (descending)
    const ridesPerDay = Object.entries(ridesPerDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get top users by ride count
    const topUsers = await prisma.ride.groupBy({
      by: ['userId'],
      where: rideDateFilter,
      _count: { userId: true },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    });

    // Get user details for top users
    const topUsersWithDetails = await Promise.all(
      topUsers.map(async (user) => {
        const userDetails = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true, name: true, email: true, company: true }
        });
        return {
          user: userDetails,
          rideCount: user._count.userId
        };
      })
    ).then(users => users.filter(user => user.user !== null)); // Filter out null users

    // Get recent admin actions
    const recentAdminActions = await prisma.adminAction.findMany({
      where: actionDateFilter,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ride: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      totalRides,
      ridesByStatus: ridesByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      ridesPerDay: ridesPerDay,
      topUsers: topUsersWithDetails,
      recentAdminActions
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

const getDashboard = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get this week's date range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get counts for different periods
    const [todayRides, weekRides, monthRides, totalRides, pendingRides, approvedRides] = await Promise.all([
      prisma.ride.count({
        where: {
          scheduledTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      prisma.ride.count({
        where: {
          scheduledTime: {
            gte: startOfWeek
          }
        }
      }),
      prisma.ride.count({
        where: {
          scheduledTime: {
            gte: startOfMonth
          }
        }
      }),
      prisma.ride.count(),
      prisma.ride.count({ where: { status: 'PENDING' } }),
      prisma.ride.count({ where: { status: 'APPROVED' } })
    ]);

    // Get recent rides
    const recentRides = await prisma.ride.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent admin actions
    const recentActions = await prisma.adminAction.findMany({
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ride: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      summary: {
        todayRides,
        weekRides,
        monthRides,
        totalRides,
        pendingRides,
        approvedRides
      },
      recentRides,
      recentActions
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
};

module.exports = {
  getAllRides,
  approveRejectRide,
  getAnalytics,
  getDashboard
}; 