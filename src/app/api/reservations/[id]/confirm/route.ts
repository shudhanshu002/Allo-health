import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

/*
  POST /api/reservations/:id/confirm

  Purpose:
  - finalize a reservation
  - deduct inventory after successful payment
  - release stock automatically if reservation expired
*/

export async function POST(
  req: Request,
  context: {
    params: Promise<{ id: string }> | { id: string };
  }
) {
  try {
    const resolvedParams = await context.params;
    const reservationId = resolvedParams?.id;

    if (!reservationId) {
      return NextResponse.json(
        { error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    const existingReservation =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },
      });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const hasExpired =
      new Date() > existingReservation.expiresAt;

    // reservation expired -> release stock
    if (hasExpired) {
      const releasedReservation =
        await prisma.reservation.updateMany({
          where: {
            id: reservationId,
            status: "PENDING",
          },
          data: {
            status: "RELEASED",
          },
        });

      // only one request should release inventory
      if (releasedReservation.count > 0) {
        await prisma.stock.update({
          where: {
            productId_warehouseId: {
              productId:
                existingReservation.productId,
              warehouseId:
                existingReservation.warehouseId,
            },
          },
          data: {
            reserved: {
              decrement:
                existingReservation.quantity,
            },
          },
        });
      }

      return NextResponse.json(
        {
          error: "Reservation expired",
        },
        {
          status: 410,
        }
      );
    }

    // confirm reservation
    const confirmedReservation =
      await prisma.reservation.updateMany({
        where: {
          id: reservationId,
          status: "PENDING",
        },
        data: {
          status: "CONFIRMED",
        },
      });

    // already confirmed/released by another request
    if (confirmedReservation.count === 0) {
      return NextResponse.json(
        {
          error: "Reservation already processed",
        },
        {
          status: 400,
        }
      );
    }

    // move reserved stock into purchased stock
    await prisma.stock.update({
      where: {
        productId_warehouseId: {
          productId:
            existingReservation.productId,
          warehouseId:
            existingReservation.warehouseId,
        },
      },
      data: {
        quantity: {
          decrement:
            existingReservation.quantity,
        },

        reserved: {
          decrement:
            existingReservation.quantity,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reservation confirmed",
    });
  } catch (err) {
    console.error(
      "Reservation confirmation failed:",
      err
    );

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}