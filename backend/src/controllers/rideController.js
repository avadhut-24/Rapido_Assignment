const prisma = require('../lib/prisma');

const createRide = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, scheduledTime, purpose, notes } = req.body;

    // Validate that scheduled time is in the future
    const scheduledDateTime = new Date(scheduledTime);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const ride = await prisma.ride.create({
      data: {
        userId: req.user.id,
        pickupLocation,
        dropLocation,
        scheduledTime: scheduledDateTime,
        purpose,
        notes,
        status: 'PENDING'
      },
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

    res.status(201).json({
      message: 'Ride request created successfully',
      ride
    });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ error: 'Failed to create ride request' });
  }
};

const getUserRides = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(status && { status })
    };

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
    console.error('Get user rides error:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
};

const getRideById = async (req, res) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
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
      }
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({ ride });
  } catch (error) {
    console.error('Get ride by ID error:', error);
    res.status(500).json({ error: 'Failed to get ride' });
  }
};

const updateRide = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, scheduledTime, purpose, notes } = req.body;

    // Check if ride exists and belongs to user
    const existingRide = await prisma.ride.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingRide) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Only allow updates for PENDING rides
    if (existingRide.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only update pending rides' });
    }

    // Validate that scheduled time is in the future
    if (scheduledTime) {
      const scheduledDateTime = new Date(scheduledTime);
      if (scheduledDateTime <= new Date()) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }
    }

    const updatedRide = await prisma.ride.update({
      where: { id: req.params.id },
      data: {
        ...(pickupLocation && { pickupLocation }),
        ...(dropLocation && { dropLocation }),
        ...(scheduledTime && { scheduledTime: new Date(scheduledTime) }),
        ...(purpose && { purpose }),
        ...(notes && { notes })
      },
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

    res.json({
      message: 'Ride updated successfully',
      ride: updatedRide
    });
  } catch (error) {
    console.error('Update ride error:', error);
    res.status(500).json({ error: 'Failed to update ride' });
  }
};

const cancelRide = async (req, res) => {
  try {
    // Check if ride exists and belongs to user
    const existingRide = await prisma.ride.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingRide) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Only allow cancellation for PENDING or APPROVED rides
    if (!['PENDING', 'APPROVED'].includes(existingRide.status)) {
      return res.status(400).json({ error: 'Can only cancel pending or approved rides' });
    }

    const cancelledRide = await prisma.ride.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
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

    res.json({
      message: 'Ride cancelled successfully',
      ride: cancelledRide
    });
  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
};

module.exports = {
  createRide,
  getUserRides,
  getRideById,
  updateRide,
  cancelRide
}; 