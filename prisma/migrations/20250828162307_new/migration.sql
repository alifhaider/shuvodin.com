-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "socialLinks" JSONB,
    "rating" REAL NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "vendorTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vendor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vendor_vendorTypeId_fkey" FOREIGN KEY ("vendorTypeId") REFERENCES "VendorType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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

-- CreateTable
CREATE TABLE "VendorType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VendorLocation" (
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

-- CreateTable
CREATE TABLE "VendorImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "objectKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vendorId" TEXT NOT NULL,
    CONSTRAINT "VendorImage_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "vendorId" TEXT NOT NULL,
    CONSTRAINT "Package_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "totalPrice" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "objectKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expirationDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "digits" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "charSet" TEXT NOT NULL,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerName" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Passkey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aaguid" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publicKey" BLOB NOT NULL,
    "userId" TEXT NOT NULL,
    "webauthnUserId" TEXT NOT NULL,
    "counter" BIGINT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VenueDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "venueTypeId" TEXT NOT NULL,
    CONSTRAINT "VenueDetails_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenueDetails_venueTypeId_fkey" FOREIGN KEY ("venueTypeId") REFERENCES "VenueType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VenueService" (
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

-- CreateTable
CREATE TABLE "VenueSpace" (
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

-- CreateTable
CREATE TABLE "VenueType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VenueAmenity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VenueEventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VenueAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "venueId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueAvailability_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhotographerDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "minPrice" REAL,
    "maxPrice" REAL,
    "additionalFee" BOOLEAN,
    "additionalFeeRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "additionalInfo" TEXT,
    CONSTRAINT "PhotographerDetails_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhotographerServedCity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "isBaseCity" BOOLEAN NOT NULL DEFAULT false,
    "hasAdditionalFee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhotographerServedCity_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "PhotographerDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhotographyStyle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PhotographyService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CatererDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "minPricePerPerson" REAL,
    "maxPricePerPerson" REAL,
    "additionalFee" BOOLEAN,
    "additionalFeeRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatererDetails_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatererServedCity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "catererId" TEXT NOT NULL,
    "isBaseCity" BOOLEAN NOT NULL DEFAULT false,
    "hasAdditionalFee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatererServedCity_catererId_fkey" FOREIGN KEY ("catererId") REFERENCES "CatererDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatererMealService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CatererCuisine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CatererDietaryOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CatererBeverageService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CatererMenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "category" TEXT,
    "catererId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatererMenuItem_catererId_fkey" FOREIGN KEY ("catererId") REFERENCES "CatererDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_UserFavorites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UserFavorites_A_fkey" FOREIGN KEY ("A") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserFavorites_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_VenueDetailsToVenueEventType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_VenueDetailsToVenueEventType_A_fkey" FOREIGN KEY ("A") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_VenueDetailsToVenueEventType_B_fkey" FOREIGN KEY ("B") REFERENCES "VenueEventType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_VenueAmenityToVenueDetails" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_VenueAmenityToVenueDetails_A_fkey" FOREIGN KEY ("A") REFERENCES "VenueAmenity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_VenueAmenityToVenueDetails_B_fkey" FOREIGN KEY ("B") REFERENCES "VenueDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PhotographerDetailsToPhotographyStyle" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PhotographerDetailsToPhotographyStyle_A_fkey" FOREIGN KEY ("A") REFERENCES "PhotographerDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PhotographerDetailsToPhotographyStyle_B_fkey" FOREIGN KEY ("B") REFERENCES "PhotographyStyle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PhotographerDetailsToPhotographyService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PhotographerDetailsToPhotographyService_A_fkey" FOREIGN KEY ("A") REFERENCES "PhotographerDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PhotographerDetailsToPhotographyService_B_fkey" FOREIGN KEY ("B") REFERENCES "PhotographyService" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CatererDetailsToCatererMealService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CatererDetailsToCatererMealService_A_fkey" FOREIGN KEY ("A") REFERENCES "CatererDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CatererDetailsToCatererMealService_B_fkey" FOREIGN KEY ("B") REFERENCES "CatererMealService" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CatererDetailsToCatererDietaryOption" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CatererDetailsToCatererDietaryOption_A_fkey" FOREIGN KEY ("A") REFERENCES "CatererDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CatererDetailsToCatererDietaryOption_B_fkey" FOREIGN KEY ("B") REFERENCES "CatererDietaryOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CatererCuisineToCatererDetails" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CatererCuisineToCatererDetails_A_fkey" FOREIGN KEY ("A") REFERENCES "CatererCuisine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CatererCuisineToCatererDetails_B_fkey" FOREIGN KEY ("B") REFERENCES "CatererDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CatererBeverageServiceToCatererDetails" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CatererBeverageServiceToCatererDetails_A_fkey" FOREIGN KEY ("A") REFERENCES "CatererBeverageService" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CatererBeverageServiceToCatererDetails_B_fkey" FOREIGN KEY ("B") REFERENCES "CatererDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_ownerId_key" ON "Vendor"("ownerId");

-- CreateIndex
CREATE INDEX "Vendor_ownerId_vendorTypeId_isFeatured_rating_businessName_idx" ON "Vendor"("ownerId", "vendorTypeId", "isFeatured", "rating", "businessName");

-- CreateIndex
CREATE UNIQUE INDEX "VendorType_slug_key" ON "VendorType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VendorType_name_key" ON "VendorType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VendorLocation_vendorId_key" ON "VendorLocation"("vendorId");

-- CreateIndex
CREATE INDEX "VendorImage_vendorId_idx" ON "VendorImage"("vendorId");

-- CreateIndex
CREATE INDEX "Booking_vendorId_userId_idx" ON "Booking"("vendorId", "userId");

-- CreateIndex
CREATE INDEX "Review_vendorId_userId_idx" ON "Review"("vendorId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserImage_userId_key" ON "UserImage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Password_userId_key" ON "Password"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_entity_access_key" ON "Permission"("action", "entity", "access");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_target_type_key" ON "Verification"("target", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_providerName_providerId_key" ON "Connection"("providerName", "providerId");

-- CreateIndex
CREATE INDEX "Passkey_userId_idx" ON "Passkey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueDetails_vendorId_key" ON "VenueDetails"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueService_name_key" ON "VenueService"("name");

-- CreateIndex
CREATE INDEX "VenueSpace_venueId_name_idx" ON "VenueSpace"("venueId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "VenueSpaceImage_venueSpaceId_key" ON "VenueSpaceImage"("venueSpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueType_name_key" ON "VenueType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VenueAmenity_name_key" ON "VenueAmenity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VenueEventType_name_key" ON "VenueEventType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PhotographerDetails_vendorId_key" ON "PhotographerDetails"("vendorId");

-- CreateIndex
CREATE INDEX "PhotographerServedCity_photographerId_idx" ON "PhotographerServedCity"("photographerId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotographyStyle_name_key" ON "PhotographyStyle"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PhotographyService_name_key" ON "PhotographyService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CatererDetails_vendorId_key" ON "CatererDetails"("vendorId");

-- CreateIndex
CREATE INDEX "CatererServedCity_catererId_idx" ON "CatererServedCity"("catererId");

-- CreateIndex
CREATE UNIQUE INDEX "CatererMealService_name_key" ON "CatererMealService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CatererCuisine_name_key" ON "CatererCuisine"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CatererDietaryOption_name_key" ON "CatererDietaryOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CatererBeverageService_name_key" ON "CatererBeverageService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_UserFavorites_AB_unique" ON "_UserFavorites"("A", "B");

-- CreateIndex
CREATE INDEX "_UserFavorites_B_index" ON "_UserFavorites"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_VenueDetailsToVenueEventType_AB_unique" ON "_VenueDetailsToVenueEventType"("A", "B");

-- CreateIndex
CREATE INDEX "_VenueDetailsToVenueEventType_B_index" ON "_VenueDetailsToVenueEventType"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_VenueAmenityToVenueDetails_AB_unique" ON "_VenueAmenityToVenueDetails"("A", "B");

-- CreateIndex
CREATE INDEX "_VenueAmenityToVenueDetails_B_index" ON "_VenueAmenityToVenueDetails"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PhotographerDetailsToPhotographyStyle_AB_unique" ON "_PhotographerDetailsToPhotographyStyle"("A", "B");

-- CreateIndex
CREATE INDEX "_PhotographerDetailsToPhotographyStyle_B_index" ON "_PhotographerDetailsToPhotographyStyle"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PhotographerDetailsToPhotographyService_AB_unique" ON "_PhotographerDetailsToPhotographyService"("A", "B");

-- CreateIndex
CREATE INDEX "_PhotographerDetailsToPhotographyService_B_index" ON "_PhotographerDetailsToPhotographyService"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CatererDetailsToCatererMealService_AB_unique" ON "_CatererDetailsToCatererMealService"("A", "B");

-- CreateIndex
CREATE INDEX "_CatererDetailsToCatererMealService_B_index" ON "_CatererDetailsToCatererMealService"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CatererDetailsToCatererDietaryOption_AB_unique" ON "_CatererDetailsToCatererDietaryOption"("A", "B");

-- CreateIndex
CREATE INDEX "_CatererDetailsToCatererDietaryOption_B_index" ON "_CatererDetailsToCatererDietaryOption"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CatererCuisineToCatererDetails_AB_unique" ON "_CatererCuisineToCatererDetails"("A", "B");

-- CreateIndex
CREATE INDEX "_CatererCuisineToCatererDetails_B_index" ON "_CatererCuisineToCatererDetails"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CatererBeverageServiceToCatererDetails_AB_unique" ON "_CatererBeverageServiceToCatererDetails"("A", "B");

-- CreateIndex
CREATE INDEX "_CatererBeverageServiceToCatererDetails_B_index" ON "_CatererBeverageServiceToCatererDetails"("B");
