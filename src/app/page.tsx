import prisma from "./lib/prisma";
import ReserveButton from "@/components/ReserveButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {

  
  // lazy cleanUp

  // find all expired pending reservations
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() }
    }
  });

  if (expiredReservations.length > 0) {
    for (const res of expiredReservations) {
      // Try to atomically claim this reservation for cleanup
      const updateResult = await prisma.reservation.updateMany({
        where: { id: res.id, status: 'PENDING' },
        data: { status: 'RELEASED' }
      });

      // ONLY if this thread successfully updated it, decrement the stock
      if (updateResult.count > 0) {
        await prisma.stock.update({
          where: {
            productId_warehouseId: {
              productId: res.productId,
              warehouseId: res.warehouseId
            }
          },
          data: { reserved: { decrement: res.quantity } }
        });
      }
    }
  }

  
  // 2. FETCH PRODUCTS WITH INVENTORY

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
    <main className="max-w-4xl mx-auto p-8">

      {/* Header */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Allo Storefront
        </h1>

        <p className="text-gray-500 mt-2">
          Real-time distributed inventory demonstration.
        </p>
      </div>

      {/* Product List */}
      <div className="grid gap-6">

        {products.map((product) => (
          <div
            key={product.id}
            className="border border-gray-200 p-6 rounded-xl shadow-sm bg-white"
          >

            {/* Product Details */}
            <h2 className="text-xl font-bold text-gray-800">
              {product.name}
            </h2>

            <p className="text-gray-500 mb-6">
              {product.description}
            </p>

            {/* Warehouse Stock */}
            <div className="space-y-3">

              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Available Locations
              </h3>

              {product.stocks.map((stock) => {

                // Calculate available stock
                const availableStock =
                  stock.quantity - stock.reserved;

                const isOutOfStock = availableStock <= 0;

                return (
                  <div
                    key={stock.warehouseId}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                  >

                    {/* Warehouse Info */}
                    <div>
                      <p className="font-medium text-gray-900">
                        {stock.warehouse.name}
                      </p>

                      <p className="text-sm text-gray-500 text-left">
                        Stock:{" "}

                        <span
                          className={`font-bold ${
                            isOutOfStock
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {availableStock} available
                        </span>
                      </p>
                    </div>

                    {/* Reserve Button */}
                    {!isOutOfStock ? (
                      <ReserveButton
                        productId={product.id}
                        warehouseId={stock.warehouseId}
                        availableStock={availableStock}
                      />
                    ) : (
                      <span className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-semibold rounded-md cursor-not-allowed">
                        Out of Stock
                      </span>
                    )}

                  </div>
                );
              })}

            </div>
          </div>
        ))}

      </div>
    </main>
  );
}