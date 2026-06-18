import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  'Hotel',
  'Restaurants',
  'Bar',
  'Spa',
  'Salon',
  'Beauty Parlour',
  'Pizza',
  'Medical',
  'Vehicle',
  'Rooms',
  'Water park',
  'Gym',
];

async function main() {
  console.log('Seeding categories...');

  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
  }

  console.log('Categories seeded successfully!');

  console.log('Seeding admin user...');

  const hashedPassword = await bcrypt.hash('12345678', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: hashedPassword },
    create: {
      firebaseUid: 'admin-firebase-uid',
      phoneNumber: '+0000000000',
      email: 'admin@gmail.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  });

  console.log(`Admin user seeded: ${admin.email} (role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
