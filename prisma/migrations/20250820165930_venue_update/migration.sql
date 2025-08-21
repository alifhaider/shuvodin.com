/*
  Warnings:

  - You are about to drop the `VendorCoverImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorProfileImage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `price` to the `VenueSpace` table without a default value. This is not possible if the table is not empty.
  - Made the column `sittingCapacity` on table `VenueSpace` required. This step will fail if there are existing NULL values in that column.
  - Made the column `standingCapacity` on table `VenueSpace` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "VendorCoverImage_vendorId_key";

-- DropIndex
DROP INDEX "VendorProfileImage_vendorId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VendorCoverImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VendorProfileImage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "VenueSpaceImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "objectKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "venueSpaceId" TEXT NOT NULL,
    CONSTRAINT "VenueSpaceImage_venueSpaceId_fkey" FOREIGN KEY ("venueSpaceId") REFERENCES "VenueSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VenueSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sittingCapacity" INTEGER NOT NULL,
    "standingCapacity" INTEGER NOT NULL,
    "parkingCapacity" INTEGER,
    "price" REAL NOT NULL,
    "venueId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueSpace_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueSpace" ("createdAt", "description", "id", "name", "parkingCapacity", "sittingCapacity", "standingCapacity", "updatedAt", "venueId") SELECT "createdAt", "description", "id", "name", "parkingCapacity", "sittingCapacity", "standingCapacity", "updatedAt", "venueId" FROM "VenueSpace";
DROP TABLE "VenueSpace";
ALTER TABLE "new_VenueSpace" RENAME TO "VenueSpace";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VenueSpaceImage_venueSpaceId_key" ON "VenueSpaceImage"("venueSpaceId");
