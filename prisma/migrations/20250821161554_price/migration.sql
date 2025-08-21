/*
  Warnings:

  - You are about to drop the column `maxCapacity` on the `VenueDetails` table. All the data in the column will be lost.
  - You are about to drop the column `maxPrice` on the `VenueDetails` table. All the data in the column will be lost.
  - You are about to drop the column `minCapacity` on the `VenueDetails` table. All the data in the column will be lost.
  - You are about to drop the column `minPrice` on the `VenueDetails` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `VenueSpace` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[venueId]` on the table `VenueSpace` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "VenueService" ADD COLUMN "price" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VenueDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "venueTypeId" TEXT NOT NULL,
    CONSTRAINT "VenueDetails_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenueDetails_venueTypeId_fkey" FOREIGN KEY ("venueTypeId") REFERENCES "VenueType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueDetails" ("createdAt", "id", "updatedAt", "vendorId", "venueTypeId") SELECT "createdAt", "id", "updatedAt", "vendorId", "venueTypeId" FROM "VenueDetails";
DROP TABLE "VenueDetails";
ALTER TABLE "new_VenueDetails" RENAME TO "VenueDetails";
CREATE UNIQUE INDEX "VenueDetails_vendorId_key" ON "VenueDetails"("vendorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VenueSpace_name_key" ON "VenueSpace"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VenueSpace_venueId_key" ON "VenueSpace"("venueId");

-- CreateIndex
CREATE INDEX "VenueSpace_venueId_name_idx" ON "VenueSpace"("venueId", "name");
