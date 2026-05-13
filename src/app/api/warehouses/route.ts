import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

/**
 * GET /api/warehouses
 * Returns a list of all warehouses in the system.
 */

export async function GET() {
  try {
    // Fetch all warehouse records from DB
    const warehouseList = await prisma.warehouse.findMany();

    return NextResponse.json(warehouseList);
  } catch (err) {
    console.error("Failed to fetch warehouses:", err);

    return NextResponse.json(
      { error: "Unable to load warehouses" },
      { status: 500 }
    );
  }
}