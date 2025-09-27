-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "division" TEXT NOT NULL,
    "thana" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT,
    "mapUrl" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT,
    "website" TEXT,
    "socialLinks" JSONB,
    "dailyBookingLimit" INTEGER NOT NULL DEFAULT 1,
    "rating" REAL NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "vendorTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vendor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vendor_vendorTypeId_fkey" FOREIGN KEY ("vendorTypeId") REFERENCES "VendorType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vendor" ("address", "businessName", "createdAt", "description", "district", "division", "id", "isFeatured", "latitude", "longitude", "mapUrl", "ownerId", "phone", "rating", "slug", "socialLinks", "thana", "updatedAt", "vendorTypeId", "website") SELECT "address", "businessName", "createdAt", "description", "district", "division", "id", "isFeatured", "latitude", "longitude", "mapUrl", "ownerId", "phone", "rating", "slug", "socialLinks", "thana", "updatedAt", "vendorTypeId", "website" FROM "Vendor";
DROP TABLE "Vendor";
ALTER TABLE "new_Vendor" RENAME TO "Vendor";
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");
CREATE UNIQUE INDEX "Vendor_ownerId_key" ON "Vendor"("ownerId");
CREATE INDEX "Vendor_ownerId_vendorTypeId_isFeatured_rating_businessName_idx" ON "Vendor"("ownerId", "vendorTypeId", "isFeatured", "rating", "businessName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
