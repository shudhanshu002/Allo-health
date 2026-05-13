import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

/*
  GET /api/reservations/:id

  Returns:
  - reservation details by ID

  Errors:
  - 400 -> missing reservation ID
  - 404 -> reservation not found
*/

export async function GET(
  req: Request,
  context: {
    params: Promise<{ id: string }> | { id: string };
  }
) {
  try {
    const resolvedParams = await context.params;
    const reservationId = resolvedParams?.id;

    // validate request
    if (!reservationId) {
      return NextResponse.json(
        {
          error: "Reservation ID is required",
        },
        {
          status: 400,
        }
      );
    }

    // fetch reservation record
    const reservationData =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },
      });

    // no reservation found
    if (!reservationData) {
      return NextResponse.json(
        {
          error: "Reservation not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(reservationData);
  } catch (err) {
    console.error(
      "Unable to fetch reservation:",
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