/*
  Warnings:

  - A unique constraint covering the columns `[venueId,name]` on the table `VenueService` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "VenueService_name_key";

-- CreateIndex
CREATE INDEX "VenueService_venueId_name_idx" ON "VenueService"("venueId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "VenueService_venueId_name_key" ON "VenueService"("venueId", "name");
