/*
  Warnings:

  - You are about to drop the `_VenueDetailsToVenueService` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `venueId` to the `VenueService` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_VenueDetailsToVenueService_B_index";

-- DropIndex
DROP INDEX "_VenueDetailsToVenueService_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_VenueDetailsToVenueService";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VenueService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "isVeg" BOOLEAN,
    "isNonVeg" BOOLEAN,
    "venueId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueService_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueService" ("createdAt", "id", "name", "price", "updatedAt") SELECT "createdAt", "id", "name", "price", "updatedAt" FROM "VenueService";
DROP TABLE "VenueService";
ALTER TABLE "new_VenueService" RENAME TO "VenueService";
CREATE UNIQUE INDEX "VenueService_name_key" ON "VenueService"("name");
CREATE UNIQUE INDEX "VenueService_venueId_key" ON "VenueService"("venueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
