/*
  Warnings:

  - You are about to drop the `_VenueDetailsToVenueType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `indoor` on the `VenueDetails` table. All the data in the column will be lost.
  - You are about to drop the column `outdoor` on the `VenueDetails` table. All the data in the column will be lost.
  - You are about to drop the column `parkingAvailable` on the `VenueDetails` table. All the data in the column will be lost.
  - You are about to drop the column `smokingAllowed` on the `VenueDetails` table. All the data in the column will be lost.
  - You are about to drop the column `wheelchairAccess` on the `VenueDetails` table. All the data in the column will be lost.
  - Added the required column `venueTypeId` to the `VenueDetails` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_VenueDetailsToVenueType_B_index";

-- DropIndex
DROP INDEX "_VenueDetailsToVenueType_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_VenueDetailsToVenueType";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "VenueService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VenueSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sittingCapacity" INTEGER,
    "standingCapacity" INTEGER,
    "parkingCapacity" INTEGER,
    "venueId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueSpace_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_VenueDetailsToVenueService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_VenueDetailsToVenueService_A_fkey" FOREIGN KEY ("A") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_VenueDetailsToVenueService_B_fkey" FOREIGN KEY ("B") REFERENCES "VenueService" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VenueDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "minPrice" REAL,
    "maxPrice" REAL,
    "minCapacity" INTEGER,
    "maxCapacity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "venueTypeId" TEXT NOT NULL,
    CONSTRAINT "VenueDetails_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenueDetails_venueTypeId_fkey" FOREIGN KEY ("venueTypeId") REFERENCES "VenueType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueDetails" ("createdAt", "id", "maxCapacity", "maxPrice", "minCapacity", "minPrice", "updatedAt", "vendorId") SELECT "createdAt", "id", "maxCapacity", "maxPrice", "minCapacity", "minPrice", "updatedAt", "vendorId" FROM "VenueDetails";
DROP TABLE "VenueDetails";
ALTER TABLE "new_VenueDetails" RENAME TO "VenueDetails";
CREATE UNIQUE INDEX "VenueDetails_vendorId_key" ON "VenueDetails"("vendorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VenueService_name_key" ON "VenueService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_VenueDetailsToVenueService_AB_unique" ON "_VenueDetailsToVenueService"("A", "B");

-- CreateIndex
CREATE INDEX "_VenueDetailsToVenueService_B_index" ON "_VenueDetailsToVenueService"("B");
