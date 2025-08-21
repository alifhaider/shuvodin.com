/*
  Warnings:

  - You are about to drop the `CatererAward` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PhotographyAward` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VenueAward` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CatererAward";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PhotographyAward";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VenueAward";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "VendorAward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VendorAward_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
