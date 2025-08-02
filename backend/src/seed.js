const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rapido.com' },
    update: {
      password: adminPassword,
      name: 'Admin User',
      phone: '+1234567890',
      company: 'Rapido',
      role: 'ADMIN'
    },
    create: {
      email: 'admin@rapido.com',
      password: adminPassword,
      name: 'Admin User',
      phone: '+1234567890',
      company: 'Rapido',
      role: 'ADMIN'
    }
  });

  // Create regular users
  const user1Password = await bcrypt.hash('user123', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@company.com' },
    update: {
      password: user1Password,
      name: 'John Doe',
      phone: '+1234567891',
      company: 'Tech Corp'
    },
    create: {
      email: 'john.doe@company.com',
      password: user1Password,
      name: 'John Doe',
      phone: '+1234567891',
      company: 'Tech Corp'
    }
  });

  const user2Password = await bcrypt.hash('user123', 12);
  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@company.com' },
    update: {
      password: user2Password,
      name: 'Jane Smith',
      phone: '+1234567892',
      company: 'Innovation Inc'
    },
    create: {
      email: 'jane.smith@company.com',
      password: user2Password,
      name: 'Jane Smith',
      phone: '+1234567892',
      company: 'Innovation Inc'
    }
  });

  const user3Password = await bcrypt.hash('user123', 12);
  const user3 = await prisma.user.upsert({
    where: { email: 'mike.johnson@company.com' },
    update: {
      password: user3Password,
      name: 'Mike Johnson',
      phone: '+1234567893',
      company: 'Startup XYZ'
    },
    create: {
      email: 'mike.johnson@company.com',
      password: user3Password,
      name: 'Mike Johnson',
      phone: '+1234567893',
      company: 'Startup XYZ'
    }
  });

  // Create sample rides
  const rides = [
    {
      userId: user1.id,
      pickupLocation: '123 Main Street, Downtown',
      dropLocation: '456 Business Park, Tech District',
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      purpose: 'Client Meeting',
      notes: 'Important client presentation',
      status: 'PENDING'
    },
    {
      userId: user1.id,
      pickupLocation: '789 Home Address, Suburb',
      dropLocation: '123 Main Street, Downtown',
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      purpose: 'Daily Commute',
      notes: 'Regular office commute',
      status: 'APPROVED'
    },
    {
      userId: user2.id,
      pickupLocation: '321 Oak Avenue, Residential Area',
      dropLocation: '654 Conference Center, Business District',
      scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      purpose: 'Conference Attendance',
      notes: 'Annual tech conference',
      status: 'PENDING'
    },
    {
      userId: user2.id,
      pickupLocation: '654 Conference Center, Business District',
      dropLocation: '321 Oak Avenue, Residential Area',
      scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      purpose: 'Return from Conference',
      notes: 'Returning from tech conference',
      status: 'COMPLETED'
    },
    {
      userId: user3.id,
      pickupLocation: '987 Innovation Hub, Startup District',
      dropLocation: '456 Business Park, Tech District',
      scheduledTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      purpose: 'Investor Meeting',
      notes: 'Pitch presentation to investors',
      status: 'PENDING'
    },
    {
      userId: user3.id,
      pickupLocation: '456 Business Park, Tech District',
      dropLocation: '987 Innovation Hub, Startup District',
      scheduledTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      purpose: 'Team Meeting',
      notes: 'Weekly team sync',
      status: 'REJECTED'
    }
  ];

  for (const rideData of rides) {
    await prisma.ride.upsert({
      where: {
        id: `${rideData.userId}-${rideData.scheduledTime.getTime()}`
      },
      update: {},
      create: rideData
    });
  }

  // Create some admin actions for approved/rejected rides
  const approvedRide = await prisma.ride.findFirst({
    where: { status: 'APPROVED' }
  });

  if (approvedRide) {
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        rideId: approvedRide.id,
        action: 'APPROVE',
        reason: 'Valid business purpose'
      }
    });
  }

  const rejectedRide = await prisma.ride.findFirst({
    where: { status: 'REJECTED' }
  });

  if (rejectedRide) {
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        rideId: rejectedRide.id,
        action: 'REJECT',
        reason: 'Insufficient business justification'
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Sample Data Created:');
  console.log(`👤 Admin User: admin@rapido.com (password: admin123)`);
  console.log(`👤 Regular Users:`);
  console.log(`   - john.doe@company.com (password: user123)`);
  console.log(`   - jane.smith@company.com (password: user123)`);
  console.log(`   - mike.johnson@company.com (password: user123)`);
  console.log(`🚗 Sample Rides: ${rides.length} rides with various statuses`);
  console.log(`📊 Admin Actions: Sample approve/reject actions`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 