const prisma = require('../lib/prisma');

// Simulate ride completion
const simulateRideCompletion = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { reason } = req.body;

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

    // Check if ride can be completed (must be approved)
    if (ride.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Can only complete approved rides' });
    }

    // Update ride status to completed (simulation only)
    const result = await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'COMPLETED' },
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
      message: 'Ride completed successfully (simulation)',
      ride: result
    });
  } catch (error) {
    console.error('Simulate ride completion error:', error);
    res.status(500).json({ error: 'Failed to simulate ride completion' });
  }
};

// Get rides eligible for completion simulation
const getRidesEligibleForCompletion = async (req, res) => {
  try {
    const eligibleRides = await prisma.ride.findMany({
      where: {
        status: 'APPROVED',
        scheduledTime: {
          lte: new Date() // Only rides that are scheduled for past time
        }
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
      },
      orderBy: {
        scheduledTime: 'desc'
      }
    });

    res.json({
      eligibleRides,
      count: eligibleRides.length
    });
  } catch (error) {
    console.error('Get eligible rides error:', error);
    res.status(500).json({ error: 'Failed to get eligible rides' });
  }
};

// Bulk simulate ride completion
const bulkSimulateRideCompletion = async (req, res) => {
  try {
    const { rideIds, reason } = req.body;

    if (!rideIds || !Array.isArray(rideIds) || rideIds.length === 0) {
      return res.status(400).json({ error: 'Ride IDs array is required' });
    }

    // Get all rides to validate
    const rides = await prisma.ride.findMany({
      where: {
        id: { in: rideIds },
        status: 'APPROVED'
      }
    });

    if (rides.length === 0) {
      return res.status(400).json({ error: 'No eligible rides found for completion' });
    }

    // Update all rides to completed (simulation only)
    const result = await Promise.all(
      rides.map(async (ride) => {
        return await prisma.ride.update({
          where: { id: ride.id },
          data: { status: 'COMPLETED' },
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
      })
    );

    res.json({
      message: `Successfully completed ${result.length} rides (simulation)`,
      completedRides: result,
      count: result.length
    });
  } catch (error) {
    console.error('Bulk simulate ride completion error:', error);
    res.status(500).json({ error: 'Failed to bulk simulate ride completion' });
  }
};

module.exports = {
  simulateRideCompletion,
  getRidesEligibleForCompletion,
  bulkSimulateRideCompletion
}; 