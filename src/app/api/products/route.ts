import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

/*
  GET /api/products

  Returns:
  - product details
  - warehouse-wise inventory
  - live available stock
*/

export async function GET() {
  try {
    const productList = await prisma.product.findMany({
      include: {
        stocks: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const response = productList.map((item) => {
      const inventory = item.stocks.map((entry) => {
        const availableUnits =
          entry.quantity - entry.reserved;

        return {
          warehouseId: entry.warehouse.id,
          warehouseName: entry.warehouse.name,
          quantity: entry.quantity,
          reserved: entry.reserved,
          available: availableUnits,
        };
      });

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        inventory,
      };
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("Failed to fetch products:", err);

    return NextResponse.json(
      {
        error: "Unable to load products",
      },
      {
        status: 500,
      }
    );
  }
}