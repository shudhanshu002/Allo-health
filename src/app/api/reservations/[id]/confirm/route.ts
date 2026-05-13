/*
  POST /api/reservations/:id/confirm

  Confirm a reservation after successful payment.
  If the reservation has already expired,
  return status 410.
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

    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // expiration check
    if (new Date() > reservation.expiresAt) {
      const updateResult = await prisma.reservation.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'RELEASED' },
      });

      if (updateResult.count > 0) {
        await prisma.stock.update({
          where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
          data: { reserved: { decrement: reservation.quantity } },
        });
      }
      return NextResponse.json({ error: 'Reservation expired.' }, { status: 410 });
    }

    // success confirm
    const updateResult = await prisma.reservation.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    }

    await prisma.stock.update({
      where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
      data: {
        quantity: { decrement: reservation.quantity }, 
        reserved: { decrement: reservation.quantity },
      },
    });

    return NextResponse.json({ message: 'Confirmed successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}