import prisma from "./lib/prisma";
import ReserveButton from "@/components/ReserveButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {

  const now = new Date();

  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
  });

  if (expired.length > 0) {
    for (const reservation of expired) {
      const updated = await prisma.reservation.updateMany({
        where: {
          id: reservation.id,
          status: "PENDING",
        },
        data: {
          status: "RELEASED",
        },
      });

      if (updated.count > 0) {
        await prisma.stock.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            reserved: {
              decrement: reservation.quantity,
            },
          },
        });
      }
    }
  }

  const products = await prisma.product.findMany({
    include: {
      stocks: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <header className="mb-12">
          <span className="inline-flex px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
            Distributed Inventory System
          </span>

          <h1 className="text-4xl md:text-5xl font-bold mt-4 text-slate-900">
            Allo Storefront
          </h1>

          <p className="mt-4 text-slate-600 max-w-3xl leading-relaxed">
            Real-time inventory synchronization across warehouses with
            reservation-based stock locking.
          </p>
        </header>

        {/* Products */}
        <div className="grid gap-6 lg:grid-cols-2">
          {products.map((product) => (
            <section
              key={product.id}
              className="rounded-3xl border bg-white shadow-sm hover:shadow-xl transition overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

              <div className="p-6">
                {/* Product header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {product.name}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    {product.description}
                  </p>
                </div>

                {/* Stock by warehouse */}
                <div className="space-y-4">
                  {product.stocks.map((stock) => {
                    const available = stock.quantity - stock.reserved;
                    const outOfStock = available <= 0;

                    return (
                      <div
                        key={stock.warehouseId}
                        className="p-4 rounded-2xl border bg-slate-50 hover:bg-white transition"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                          {/* Warehouse info */}
                          <div>
                            <p className="text-lg font-semibold text-slate-900">
                              {stock.warehouse.name}
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  outOfStock ? "bg-red-500" : "bg-green-500"
                                }`}
                              />

                              <span
                                className={`text-sm font-medium ${
                                  outOfStock
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {available} available
                              </span>
                            </div>
                          </div>

                          {/* Action */}
                          <div className="w-full lg:w-auto">
                            {outOfStock ? (
                              <span className="inline-block px-4 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-semibold border border-red-100">
                                Sold Out
                              </span>
                            ) : (
                              <ReserveButton
                                productId={product.id}
                                warehouseId={stock.warehouseId}
                                availableStock={available}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Empty state */}
        {products.length === 0 && (
          <div className="text-center py-32">
            <h2 className="text-2xl font-semibold text-slate-700">
              No products available
            </h2>
            <p className="mt-3 text-slate-500">
              Inventory will appear here once items are added.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}