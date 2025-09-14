/*
  Warnings:

  - You are about to drop the `VenueSpaceImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_VenueAmenityToVenueDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_VenueDetailsToVenueEventType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `VenueAmenity` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `VenueAmenity` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `VenueAmenity` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `VenueEventType` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `VenueService` table. All the data in the column will be lost.
  - You are about to drop the column `isVeg` on the `VenueService` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `VenueService` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `VenueService` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `VenueSpace` table. All the data in the column will be lost.
  - You are about to drop the column `includeInTotalPrice` on the `VenueSpace` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `VenueSpace` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `VenueSpace` table. All the data in the column will be lost.
  - Added the required column `globalAmenityId` to the `VenueAmenity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venueId` to the `VenueAmenity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `globalEventTypeId` to the `VenueEventType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venueId` to the `VenueEventType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `globalServiceId` to the `VenueService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `globalSpaceId` to the `VenueSpace` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "VenueSpaceImage_venueSpaceId_key";

-- DropIndex
DROP INDEX "_VenueAmenityToVenueDetails_B_index";

-- DropIndex
DROP INDEX "_VenueAmenityToVenueDetails_AB_unique";

-- DropIndex
DROP INDEX "_VenueDetailsToVenueEventType_B_index";

-- DropIndex
DROP INDEX "_VenueDetailsToVenueEventType_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VenueSpaceImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_VenueAmenityToVenueDetails";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_VenueDetailsToVenueEventType";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "GlobalVenueSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GlobalVenueService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GlobalVenueAmenity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GlobalVenueEventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VenueAmenity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "globalAmenityId" TEXT NOT NULL,
    CONSTRAINT "VenueAmenity_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenueAmenity_globalAmenityId_fkey" FOREIGN KEY ("globalAmenityId") REFERENCES "GlobalVenueAmenity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueAmenity" ("id") SELECT "id" FROM "VenueAmenity";
DROP TABLE "VenueAmenity";
ALTER TABLE "new_VenueAmenity" RENAME TO "VenueAmenity";
CREATE INDEX "VenueAmenity_venueId_idx" ON "VenueAmenity"("venueId");
CREATE UNIQUE INDEX "VenueAmenity_venueId_globalAmenityId_key" ON "VenueAmenity"("venueId", "globalAmenityId");
CREATE TABLE "new_VenueEventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "globalEventTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueEventType_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenueEventType_globalEventTypeId_fkey" FOREIGN KEY ("globalEventTypeId") REFERENCES "GlobalVenueEventType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueEventType" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "VenueEventType";
DROP TABLE "VenueEventType";
ALTER TABLE "new_VenueEventType" RENAME TO "VenueEventType";
CREATE INDEX "VenueEventType_venueId_idx" ON "VenueEventType"("venueId");
CREATE UNIQUE INDEX "VenueEventType_venueId_globalEventTypeId_key" ON "VenueEventType"("venueId", "globalEventTypeId");
CREATE TABLE "new_VenueService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" REAL,
    "description" TEXT,
    "venueId" TEXT NOT NULL,
    "globalServiceId" TEXT NOT NULL,
    CONSTRAINT "VenueService_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenueService_globalServiceId_fkey" FOREIGN KEY ("globalServiceId") REFERENCES "GlobalVenueService" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueService" ("description", "id", "price", "venueId") SELECT "description", "id", "price", "venueId" FROM "VenueService";
DROP TABLE "VenueService";
ALTER TABLE "new_VenueService" RENAME TO "VenueService";
CREATE INDEX "VenueService_venueId_idx" ON "VenueService"("venueId");
CREATE UNIQUE INDEX "VenueService_venueId_globalServiceId_key" ON "VenueService"("venueId", "globalServiceId");
CREATE TABLE "new_VenueSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" REAL,
    "description" TEXT,
    "sittingCapacity" INTEGER NOT NULL,
    "standingCapacity" INTEGER NOT NULL,
    "parkingCapacity" INTEGER,
    "venueId" TEXT NOT NULL,
    "globalSpaceId" TEXT NOT NULL,
    CONSTRAINT "VenueSpace_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenueSpace_globalSpaceId_fkey" FOREIGN KEY ("globalSpaceId") REFERENCES "GlobalVenueSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueSpace" ("description", "id", "parkingCapacity", "price", "sittingCapacity", "standingCapacity", "venueId") SELECT "description", "id", "parkingCapacity", "price", "sittingCapacity", "standingCapacity", "venueId" FROM "VenueSpace";
DROP TABLE "VenueSpace";
ALTER TABLE "new_VenueSpace" RENAME TO "VenueSpace";
CREATE INDEX "VenueSpace_venueId_idx" ON "VenueSpace"("venueId");
CREATE UNIQUE INDEX "VenueSpace_venueId_globalSpaceId_key" ON "VenueSpace"("venueId", "globalSpaceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GlobalVenueSpace_name_key" ON "GlobalVenueSpace"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalVenueService_name_key" ON "GlobalVenueService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalVenueAmenity_name_key" ON "GlobalVenueAmenity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalVenueEventType_name_key" ON "GlobalVenueEventType"("name");
