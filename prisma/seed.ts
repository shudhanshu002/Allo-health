import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Create warehouses FIRST
  const wh1 = await prisma.warehouse.create({
    data: {
      name: "Mumbai Central",
      location: "Mumbai",
    },
  });

  const wh2 = await prisma.warehouse.create({
    data: {
      name: "Bangalore East",
      location: "Bangalore",
    },
  });

  // Create products
  const p1 = await prisma.product.create({
    data: {
      name: "Allo Smart Watch",
      description: "Health tracking enabled",
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Allo Glucose Monitor",
      description: "Real-time monitoring",
    },
  });

  // Stock
  await prisma.stock.createMany({
    data: [
      {
        productId: p1.id,
        warehouseId: wh1.id,
        quantity: 15,
        reserved: 0,
      },
      {
        productId: p1.id,
        warehouseId: wh2.id,
        quantity: 8,
        reserved: 0,
      },
      {
        productId: p2.id,
        warehouseId: wh1.id,
        quantity: 20,
        reserved: 0,
      },
    ],
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });