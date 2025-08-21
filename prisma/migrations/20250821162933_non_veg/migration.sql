/*
  Warnings:

  - You are about to drop the column `isNonVeg` on the `VenueService` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VenueService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "isVeg" BOOLEAN,
    "venueId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueService_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueService" ("createdAt", "description", "id", "isVeg", "name", "price", "updatedAt", "venueId") SELECT "createdAt", "description", "id", "isVeg", "name", "price", "updatedAt", "venueId" FROM "VenueService";
DROP TABLE "VenueService";
ALTER TABLE "new_VenueService" RENAME TO "VenueService";
CREATE UNIQUE INDEX "VenueService_name_key" ON "VenueService"("name");
CREATE UNIQUE INDEX "VenueService_venueId_key" ON "VenueService"("venueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
