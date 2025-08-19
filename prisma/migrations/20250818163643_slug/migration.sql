/*
  Warnings:

  - Added the required column `slug` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "socialLinks" JSONB,
    "rating" REAL NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    "vendorTypeId" TEXT NOT NULL,
    CONSTRAINT "Vendor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vendor_vendorTypeId_fkey" FOREIGN KEY ("vendorTypeId") REFERENCES "VendorType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vendor" ("businessName", "createdAt", "description", "id", "isFeatured", "ownerId", "phone", "rating", "socialLinks", "updatedAt", "vendorTypeId", "website") SELECT "businessName", "createdAt", "description", "id", "isFeatured", "ownerId", "phone", "rating", "socialLinks", "updatedAt", "vendorTypeId", "website" FROM "Vendor";
DROP TABLE "Vendor";
ALTER TABLE "new_Vendor" RENAME TO "Vendor";
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");
CREATE UNIQUE INDEX "Vendor_ownerId_key" ON "Vendor"("ownerId");
CREATE INDEX "Vendor_ownerId_idx" ON "Vendor"("ownerId");
CREATE INDEX "Vendor_vendorTypeId_idx" ON "Vendor"("vendorTypeId");
CREATE INDEX "Vendor_isFeatured_idx" ON "Vendor"("isFeatured");
CREATE INDEX "Vendor_rating_idx" ON "Vendor"("rating");
CREATE INDEX "Vendor_businessName_idx" ON "Vendor"("businessName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
