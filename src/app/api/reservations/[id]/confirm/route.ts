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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // find reservation by ID
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    // reservation must be pending
    if (!reservation || reservation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check whether reservation expired
    if (new Date() > reservation.expiresAt) {
      return NextResponse.json(
        { error: 'Reservation expired' },
        { status: 410 }
      );
    }

    // Confirm reservation and update stock
    await prisma.$transaction([
      prisma.reservation.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
        },
      }),

      prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          quantity: {
            decrement: reservation.quantity,
          },
          reserved: {
            decrement: reservation.quantity,
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Confirmed',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}