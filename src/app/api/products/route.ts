/*
  GET /api/products

  Fetch all products with stock details
  from every warehouse.
*/

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch products with stock + warehouse info
    const products = await prisma.product.findMany({
      include: {
        stocks: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,

      // Inventory details per warehouse
      inventory: product.stocks.map((stock) => ({
        warehouseId: stock.warehouse.id,
        warehouseName: stock.warehouse.name,

        // Total stock quantity
        quantity: stock.quantity,

        // Reserved stock
        reserved: stock.reserved,

        // Available stock
        available: stock.quantity - stock.reserved,
      })),
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Products API Error:', error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}