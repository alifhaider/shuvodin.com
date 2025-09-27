/*
  Warnings:

  - You are about to drop the column `details` on the `BookingItem` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BookingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BookingItem" ("bookingId", "id", "name", "price", "serviceId") SELECT "bookingId", "id", "name", "price", "serviceId" FROM "BookingItem";
DROP TABLE "BookingItem";
ALTER TABLE "new_BookingItem" RENAME TO "BookingItem";
CREATE INDEX "BookingItem_bookingId_idx" ON "BookingItem"("bookingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
