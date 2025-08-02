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

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.scheduledTime = {};
      if (startDate) dateFilter.scheduledTime.gte = new Date(startDate);
      if (endDate) dateFilter.scheduledTime.lte = new Date(endDate);
    }

    // Get total rides
    const totalRides = await prisma.ride.count({ where: dateFilter });

    // Get rides by status
    const ridesByStatus = await prisma.ride.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { status: true }
    });

    // Get rides per day (last 30 days if no date range)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ridesPerDay = await prisma.ride.groupBy({
      by: ['scheduledTime'],
      where: {
        ...dateFilter,
        scheduledTime: {
          gte: startDate ? new Date(startDate) : thirtyDaysAgo
        }
      },
      _count: { scheduledTime: true }
    });

    // Get top users by ride count
    const topUsers = await prisma.ride.groupBy({
      by: ['userId'],
      where: dateFilter,
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
    );

    // Get recent admin actions
    const recentAdminActions = await prisma.adminAction.findMany({
      where: dateFilter,
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
      ridesPerDay: ridesPerDay.map(item => ({
        date: item.scheduledTime.toISOString().split('T')[0],
        count: item._count.scheduledTime
      })),
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