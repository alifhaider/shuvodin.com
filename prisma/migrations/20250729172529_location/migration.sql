/*
  Warnings:

  - You are about to drop the column `address` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Vendor` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "VendorLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vendorId" TEXT NOT NULL,
    CONSTRAINT "VendorLocation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "socialLinks" JSONB,
    "rating" REAL NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Vendor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VendorCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vendor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vendor" ("businessName", "categoryId", "createdAt", "description", "id", "isFeatured", "ownerId", "phone", "rating", "socialLinks", "updatedAt", "website") SELECT "businessName", "categoryId", "createdAt", "description", "id", "isFeatured", "ownerId", "phone", "rating", "socialLinks", "updatedAt", "website" FROM "Vendor";
DROP TABLE "Vendor";
ALTER TABLE "new_Vendor" RENAME TO "Vendor";
CREATE UNIQUE INDEX "Vendor_ownerId_key" ON "Vendor"("ownerId");
CREATE INDEX "Vendor_ownerId_idx" ON "Vendor"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VendorLocation_vendorId_key" ON "VendorLocation"("vendorId");
