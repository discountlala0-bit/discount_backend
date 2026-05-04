import { PrismaClient } from '@prisma/client';

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
