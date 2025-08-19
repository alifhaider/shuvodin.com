/*
  Warnings:

  - Added the required column `slug` to the `VendorType` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Booking_userId_idx";

-- DropIndex
DROP INDEX "Booking_vendorId_idx";

-- DropIndex
DROP INDEX "Review_userId_idx";

-- DropIndex
DROP INDEX "Review_vendorId_idx";

-- DropIndex
DROP INDEX "Vendor_businessName_idx";

-- DropIndex
DROP INDEX "Vendor_rating_idx";

-- DropIndex
DROP INDEX "Vendor_isFeatured_idx";

-- DropIndex
DROP INDEX "Vendor_vendorTypeId_idx";

-- DropIndex
DROP INDEX "Vendor_ownerId_idx";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VendorType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_VendorType" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "VendorType";
DROP TABLE "VendorType";
ALTER TABLE "new_VendorType" RENAME TO "VendorType";
CREATE UNIQUE INDEX "VendorType_slug_key" ON "VendorType"("slug");
CREATE UNIQUE INDEX "VendorType_name_key" ON "VendorType"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Booking_vendorId_userId_idx" ON "Booking"("vendorId", "userId");

-- CreateIndex
CREATE INDEX "Review_vendorId_userId_idx" ON "Review"("vendorId", "userId");

-- CreateIndex
CREATE INDEX "Vendor_ownerId_vendorTypeId_isFeatured_rating_businessName_idx" ON "Vendor"("ownerId", "vendorTypeId", "isFeatured", "rating", "businessName");
