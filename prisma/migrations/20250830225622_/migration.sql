/*
  Warnings:

  - You are about to drop the `VendorLocation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `district` to the `Vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `division` to the `Vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thana` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "VendorLocation_vendorId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VendorLocation";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "division" TEXT NOT NULL,
    "thana" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT,
    "mapUrl" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT,
    "website" TEXT,
    "socialLinks" JSONB,
    "rating" REAL NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "vendorTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vendor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vendor_vendorTypeId_fkey" FOREIGN KEY ("vendorTypeId") REFERENCES "VendorType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vendor" ("businessName", "createdAt", "description", "id", "isFeatured", "ownerId", "phone", "rating", "slug", "socialLinks", "updatedAt", "vendorTypeId", "website") SELECT "businessName", "createdAt", "description", "id", "isFeatured", "ownerId", "phone", "rating", "slug", "socialLinks", "updatedAt", "vendorTypeId", "website" FROM "Vendor";
DROP TABLE "Vendor";
ALTER TABLE "new_Vendor" RENAME TO "Vendor";
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");
CREATE UNIQUE INDEX "Vendor_ownerId_key" ON "Vendor"("ownerId");
CREATE INDEX "Vendor_ownerId_vendorTypeId_isFeatured_rating_businessName_idx" ON "Vendor"("ownerId", "vendorTypeId", "isFeatured", "rating", "businessName");
CREATE TABLE "new_VenueSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sittingCapacity" INTEGER NOT NULL,
    "standingCapacity" INTEGER NOT NULL,
    "parkingCapacity" INTEGER,
    "price" REAL,
    "includeInTotalPrice" BOOLEAN NOT NULL DEFAULT false,
    "venueId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueSpace_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueSpace" ("createdAt", "description", "id", "includeInTotalPrice", "name", "parkingCapacity", "price", "sittingCapacity", "standingCapacity", "updatedAt", "venueId") SELECT "createdAt", "description", "id", "includeInTotalPrice", "name", "parkingCapacity", "price", "sittingCapacity", "standingCapacity", "updatedAt", "venueId" FROM "VenueSpace";
DROP TABLE "VenueSpace";
ALTER TABLE "new_VenueSpace" RENAME TO "VenueSpace";
CREATE INDEX "VenueSpace_venueId_name_idx" ON "VenueSpace"("venueId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
