/*
{**
    POST /api/reservations  
    -Reserve units for a product/warehouse. 
    Return 409 if there isn't enough stock 
    available.
***} 
*/

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { z } from 'zod';

const reserveSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, warehouseId, quantity } = reserveSchema.parse(body);
    
    // set to reserve if ( total - reserved) >= req quantity
    const updateResult = await prisma.$executeRaw`
      UPDATE "Stock"
      SET "reserved" = "reserved" + ${quantity}
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND ("quantity" - "reserved") >= ${quantity}
    `;

    // if no row updated {insufficient case}
    if (updateResult === 0) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 409 });
    }

    // create req for reservation if stock available
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const reservation = await prisma.reservation.create({
      data: {
        productId,
        warehouseId,
        quantity,
        expiresAt,
        status: 'PENDING',
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}