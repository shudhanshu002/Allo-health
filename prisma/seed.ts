import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.product.deleteMany();

  // Create warehouses
  const wh1 = await prisma.warehouse.create({
    data: {
      name: 'Mumbai Central',
      location: 'Mumbai',
    },
  });

  const wh2 = await prisma.warehouse.create({
    data: {
      name: 'Bangalore East',
      location: 'Bangalore',
    },
  });

  // Create products
  const p1 = await prisma.product.create({
    data: {
      name: 'Allo Smart Watch',
      description: 'Health tracking enabled',
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Allo Glucose Monitor',
      description: 'Real-time monitoring',
    },
  });

  // Seed stock
  await prisma.stock.createMany({
    data: [
      {
        productId: p1.id,
        warehouseId: wh1.id,
        quantity: 15,
      },
      {
        productId: p1.id,
        warehouseId: wh2.id,
        quantity: 8,
      },
      {
        productId: p2.id,
        warehouseId: wh1.id,
        quantity: 20,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });