import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

/*
  POST /api/reservations/:id/release

  Used when:
  - user cancels checkout
  - payment fails
  - reservation needs early release
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
        {
          error: "Reservation ID missing",
        },
        {
          status: 400,
        }
      );
    }

    // update only if reservation is still pending
    const releaseOperation =
      await prisma.reservation.updateMany({
        where: {
          id: reservationId,
          status: "PENDING",
        },

        data: {
          status: "RELEASED",
        },
      });

    // already confirmed/released before this request
    if (releaseOperation.count === 0) {
      return NextResponse.json(
        {
          error: "Reservation already processed",
        },
        {
          status: 400,
        }
      );
    }

    // fetch reservation details for stock restoration
    const reservationRecord =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },
      });

    if (reservationRecord) {
      await prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId:
              reservationRecord.productId,

            warehouseId:
              reservationRecord.warehouseId,
          },
        },

        data: {
          reserved: {
            decrement:
              reservationRecord.quantity,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Reservation released successfully",
    });
  } catch (err) {
    console.error(
      "Reservation release failed:",
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