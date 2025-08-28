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
    "price" REAL,
    "includeInTotalPrice" BOOLEAN NOT NULL DEFAULT true,
    "venueId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueSpace_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VenueSpace" ("createdAt", "description", "id", "name", "parkingCapacity", "price", "sittingCapacity", "standingCapacity", "updatedAt", "venueId") SELECT "createdAt", "description", "id", "name", "parkingCapacity", "price", "sittingCapacity", "standingCapacity", "updatedAt", "venueId" FROM "VenueSpace";
DROP TABLE "VenueSpace";
ALTER TABLE "new_VenueSpace" RENAME TO "VenueSpace";
CREATE INDEX "VenueSpace_venueId_name_idx" ON "VenueSpace"("venueId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
