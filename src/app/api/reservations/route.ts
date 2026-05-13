/**
 * POST /api/reservations
 * Reserves stock for a product in a warehouse.
 * Returns 409 if available stock is insufficient.
 */

import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { z } from "zod";

// Input validation schema
const reservationSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Validate incoming request body
    const { productId, warehouseId, quantity } =
      reservationSchema.parse(payload);

    
    const affectedRows = await prisma.$executeRaw`
      UPDATE "Stock"
      SET "reserved" = "reserved" + ${quantity}
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND ("quantity" - "reserved") >= ${quantity}
    `;

    // If nothing was updated → stock not sufficient
    if (affectedRows === 0) {
      return NextResponse.json(
        { error: "Insufficient stock available" },
        { status: 409 }
      );
    }

    // Create reservation record with expiry
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newReservation = await prisma.reservation.create({
      data: {
        productId,
        warehouseId,
        quantity,
        expiresAt: expiryTime,
        status: "PENDING",
      },
    });

    return NextResponse.json(newReservation, { status: 201 });
  } catch (err) {
    console.error("Reservation creation failed:", err);

    return NextResponse.json(
      { error: "Unable to process reservation request" },
      { status: 500 }
    );
  }
}