/*
  Warnings:

  - Added the required column `thana` to the `VendorLocation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VendorLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "division" TEXT NOT NULL,
    "thana" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT,
    "mapUrl" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vendorId" TEXT NOT NULL,
    CONSTRAINT "VendorLocation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VendorLocation" ("address", "createdAt", "district", "division", "id", "latitude", "longitude", "mapUrl", "updatedAt", "vendorId") SELECT "address", "createdAt", "district", "division", "id", "latitude", "longitude", "mapUrl", "updatedAt", "vendorId" FROM "VendorLocation";
DROP TABLE "VendorLocation";
ALTER TABLE "new_VendorLocation" RENAME TO "VendorLocation";
CREATE UNIQUE INDEX "VendorLocation_vendorId_key" ON "VendorLocation"("vendorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
