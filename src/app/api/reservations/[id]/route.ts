/*
  GET /api/reservations/:id

  Fetch a single reservation using its ID.
  Return 404 if reservation does not exist.
*/

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Extract reservation ID safely 
    const params = await context.params;
    const id = params?.id;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is missing' },
        { status: 400 }
      );
    }

    // Fetch reservation from database
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    // Reservation not found
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Return reservation data
    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Fetch Reservation Error:', error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}