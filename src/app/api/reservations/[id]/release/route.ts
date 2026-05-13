/*
    {
    POST /api/reservations/:id/release 
    Release the reservation early (payment 
    failed or user cancelled)
    }
*/


import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await context.params;
    const id = params?.id;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // try to change status to RELEASED, but ONLY if it is still PENDING.
    const updateResult = await prisma.reservation.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'RELEASED' },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (reservation) {
      await prisma.stock.update({
        where: { 
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId
          }
        },
        data: { reserved: { decrement: reservation.quantity } },
      });
    }

    return NextResponse.json({ message: 'Released successfully' });
  } catch (error) {
    console.error("Release Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}