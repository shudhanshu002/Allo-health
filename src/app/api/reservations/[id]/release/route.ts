/*
    {
    POST /api/reservations/:id/release 
    Release the reservation early (payment 
    failed or user cancelled)
    }
*/


import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// Use a more generic context type to handle Next.js param changes safely
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 1. Safely await and extract params 
    const params = await context.params;
    const id = params?.id;

    // 2. Prevent Prisma from crashing if ID is missing from the URL
    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is missing' }, { status: 400 });
    }

    // 3. Now it is 100% safe to query
    const reservation = await prisma.reservation.findUnique({ 
      where: { id } 
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cannot release a processed reservation' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id },
        data: { status: 'RELEASED' },
      }),
      prisma.stock.update({
        where: { 
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId
          }
        },
        data: { reserved: { decrement: reservation.quantity } },
      }),
    ]);

    return NextResponse.json({ message: 'Reservation released successfully' });
  } catch (error) {
    console.error("Release Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}