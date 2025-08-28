import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import { VendorType } from '#app/utils/misc.tsx'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	createPassword,
	createUser,
	getVendorImages,
	getUserImages,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'

const mockVendorLocations = [
	{
		division: 'Dhaka',
		district: 'Dhaka',
		thana: 'Dhanmondi',
		address: '123 Main St, Dhaka',
	},
	{
		division: 'Chittagong',
		district: 'Chittagong',
		thana: 'Pahartali',
		address: '456 Elm St, Chittagong',
	},
	{
		division: 'Sylhet',
		district: 'Sylhet',
		thana: 'Sylhet Sadar',
		address: '789 Oak St, Sylhet',
	},
	{
		division: 'Rajshahi',
		district: 'Naogaon',
		thana: 'Mohadebpur',
		address: 'Mohadebpur Busstand',
	},
]

async function seed() {
	console.log('🌱 Seeding...')

	console.time(`🌱 Clearing existing data...`)
	await prisma.photographyStyle.deleteMany({})
	await prisma.photographyService.deleteMany({})
	await prisma.photographerDetails.deleteMany({})
	await prisma.catererDetails.deleteMany({})
	await prisma.catererMealService.deleteMany({})
	await prisma.catererBeverageService.deleteMany({})
	await prisma.catererMenuItem.deleteMany({})
	await prisma.catererServedCity.deleteMany({})

	await prisma.venueEventType.deleteMany({})
	await prisma.venueAmenity.deleteMany({})
	await prisma.venueType.deleteMany({})
	await prisma.venueSpace.deleteMany({})
	await prisma.venueService.deleteMany({})
	await prisma.venueAvailability.deleteMany({})
	await prisma.venueDetails.deleteMany({})

	await prisma.booking.deleteMany({})
	await prisma.package.deleteMany({})
	await prisma.review.deleteMany({})
	await prisma.vendor.deleteMany({})
	await prisma.vendorType.deleteMany({})
	await prisma.userImage.deleteMany({})
	await prisma.user.deleteMany({})
	await prisma.password.deleteMany({})
	await prisma.session.deleteMany({})
	await prisma.connection.deleteMany({})
	await prisma.role.deleteMany({})

	console.timeEnd(`🌱 Clearing existing data...`)

	console.time(`🌱 Database has been seeded`)

	console.time('📦 Creating vendor types...')
	await prisma.vendorType.createMany({
		data: [
			{
				name: VendorType.VENUE,
				slug: 'venue',
				description: 'Event venues and locations',
			},
		],
	})
	console.timeEnd('📦 Creating vendor types...')

	const vendorTypes = await prisma.vendorType.findMany()

	const photographyStyles = [
		'Classic',
		'Editorial',
		'Fine Art',
		'Photojournalistic',
		'Vintage',
		'Dark & Moody',
		'Light & Airy',
		'Documentary',
	]
	const photographyServices = [
		'Bride-only session',
		'Drone photography',
		'Engagement session',
		'Extra hours',
		'Image editing',
		'Online proofing',
		'Printing rights',
		'Same-day edits',
		'Second photographer',
	]

	await prisma.role.createMany({
		data: [{ name: 'user' }, { name: 'vendor' }, { name: 'admin' }],
	})

	const totalUsers = 20
	console.time(`👤 Created ${totalUsers} users...`)
	const userImages = await getUserImages()

	const users = await Promise.all(
		Array.from({ length: totalUsers }, async (_, index) => {
			const userData = createUser()
			const user = await prisma.user.create({
				select: { id: true },
				data: {
					...userData,
					password: { create: createPassword(userData.username) },
					roles: { connect: { name: 'user' } },
				},
			})
			const userImage = userImages[index % userImages.length]
			if (userImage) {
				await prisma.userImage.create({
					data: {
						userId: user.id,
						objectKey: userImage.objectKey,
					},
				})
			}
			return user
		}),
	)
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	// const totalPhotographyStyles = photographyStyles.length
	// console.time(`📷 Created ${totalPhotographyStyles} photography styles...`)
	// await prisma.photographyStyle.createMany({
	// 	data: photographyStyles.map((style) => ({ name: style })),
	// })
	// console.timeEnd(`📷 Created ${totalPhotographyStyles} photography styles...`)

	// const totalPhotographyServices = photographyServices.length
	// console.time(
	// 	`📷 Created ${totalPhotographyServices} photography services...`,
	// )
	// await prisma.photographyService.createMany({
	// 	data: photographyServices.map((service) => ({ name: service })),
	// })
	// console.timeEnd(
	// 	`📷 Created ${totalPhotographyServices} photography services...`,
	// )

	const totalVendors = 10
	console.time(`📷 Created ${totalVendors} vendors...`)

	const vendors = await Promise.all(
		Array.from({ length: totalVendors }, async (_, index) => {
			const user = users[index % users.length]
			if (!user) {
				throw new Error(`User not found for index ${index}`)
			}
			const companyName = faker.company.name()
			const vendor = await prisma.vendor.create({
				data: {
					businessName: companyName,
					slug: faker.helpers.slugify(companyName),
					description: faker.lorem.paragraph(),
					ownerId: user.id,
					vendorTypeId: faker.helpers.arrayElement(vendorTypes)?.id,
					phone: faker.phone.number(),
					website: faker.internet.url(),
					rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
					location: { create: faker.helpers.arrayElement(mockVendorLocations) },
					isFeatured: faker.datatype.boolean(),
					awards: {
						create: faker.helpers
							.arrayElements(['Best Vendor 2025', 'Top Rated Vendor'], {
								min: 1,
								max: 2,
							})
							.map((name) => ({
								name,
								year: faker.number.int({ min: 2020, max: 2025 }),
							})),
					},
					socialLinks: {
						facebook: faker.internet.url(),
						instagram: faker.internet.url(),
						twitter: faker.internet.url(),
					},
					gallery: {
						create: await getVendorImages().then((images) =>
							images.map((image) => ({
								objectKey: image.objectKey,
								altText: image.altText,
							})),
						),
					},
				},
			})
			await prisma.review.create({
				data: {
					rating: faker.number.int({ min: 1, max: 5 }),
					comment: faker.lorem.sentence(),
					userId: user.id,
					vendorId: vendor.id,
				},
			})
			await prisma.package.create({
				data: {
					title: faker.commerce.productName(),
					description: faker.lorem.paragraph(),
					price: faker.number.int({ min: 100, max: 1000 }),
					vendorId: vendor.id,
				},
			})

			return vendor
		}),
	)
	console.timeEnd(`📷 Created ${totalVendors} vendors...`)

	// const totalPhotographers = 5
	// console.time(`📷 Created ${totalPhotographers} photographers...`)
	// const photographers = await Promise.all(
	// 	Array.from({ length: totalPhotographers }, async (_, index) => {
	// 		if (index >= vendors.length) {
	// 			throw new Error(
	// 				`Not enough vendors to create ${totalPhotographers} photographers`,
	// 			)
	// 		}
	// 		const vendor = vendors[index]
	// 		if (!vendor) {
	// 			throw new Error(`Vendor not found for index ${index}`)
	// 		}
	// 		const photographer = await prisma.photographerDetails.create({
	// 			data: {
	// 				vendorId: vendor.id,
	// 				styles: {
	// 					connect: faker.helpers
	// 						.arrayElements(await prisma.photographyStyle.findMany(), {
	// 							min: 1,
	// 							max: 3,
	// 						})
	// 						.map((style) => ({ name: style.name })),
	// 				},
	// 				services: {
	// 					connect: faker.helpers
	// 						.arrayElements(await prisma.photographyService.findMany(), {
	// 							min: 1,
	// 							max: 3,
	// 						})
	// 						.map((service) => ({ name: service.name })),
	// 				},
	// 				additionalFee: faker.datatype.boolean(),
	// 				additionalFeeRate: faker.number.int({ min: 50, max: 500 }),
	// 				additionalInfo: faker.lorem.paragraph(),
	// 				minPrice: faker.number.int({ min: 1000, max: 5000 }),
	// 				maxPrice: faker.number.int({ min: 5000, max: 20000 }),
	// 				servedCities: {
	// 					create: faker.helpers
	// 						.arrayElements(mockVendorLocations, { min: 1, max: 3 })
	// 						.map((location) => ({
	// 							city: location.city,
	// 							isBaseCity: location.city === 'Dhaka',
	// 							hasAdditionalFee: faker.datatype.boolean(),
	// 						})),
	// 				},
	// 			},
	// 		})

	// 		return photographer
	// 	}),
	// )

	// console.timeEnd(`📷 Created ${totalPhotographers} photographers...`)

	const totalVenues = 5
	console.time(`🏛️ Created ${totalVenues} venues...`)

	const mockVenueTypes = [
		'Convention Center',
		'Banquet Hall',
		'Community Center',
		'Community Hall',
	]

	const mockVenueSpaces = [
		{
			name: 'Main Hall',
			sittingCapacity: 200,
			standingCapacity: 300,
			includeInTotalPrice: true,
			description: faker.lorem.sentence({ max: 20, min: 10 }),
		},
		{
			name: 'Garden',
			sittingCapacity: 100,
			standingCapacity: 150,
			price: 15000,
			description: 'Beautiful outdoor garden for weddings and events',
		},
		{
			name: 'Rooftop',
			sittingCapacity: 80,
			standingCapacity: 120,
			price: 20000,
			description: faker.lorem.sentence({ max: 20, min: 10 }),
		},
		{
			name: 'Conference Room',
			sittingCapacity: 50,
			standingCapacity: 70,
			price: 10000,
		},
		{
			name: 'Ballroom',
			sittingCapacity: 300,
			standingCapacity: 400,
			price: 30000,
		},
	]

	const mockVenueAmenities = [
		'Dance Floor',
		'Stage',
		'Sound System',
		'Projector',
		'Parking',
		'Coat Check',
		'Bridal Suite',
		'Groom Suite',
		'Outdoor Space',
		'Kitchen Facilities',
	]

	const mockVenueServices = [
		{
			name: 'Catering',
			price: 1000,
			description: 'Rice, lentils, vegetables, and salad',
			isVeg: true,
		},
		{
			name: 'Catering',
			price: 1500,
			description: 'Chicken, beef, and fish dishes',
			isVeg: false,
		},
		{
			name: 'Decoration',
			price: 500,
			description: 'Basic decoration with flowers and lights',
		},
		{
			name: 'Decoration',
			price: 1000,
			description: 'Premium decoration with themes and custom designs',
		},
	]

	const mockVenueEventTypes = [
		'Wedding',
		'Corporate',
		'Birthday',
		'Anniversary',
		'Conference',
		'Gala',
		'Fundraiser',
		'Graduation',
	]

	console.time(`🏛️ Created ${mockVenueEventTypes.length} event types...`)
	await prisma.venueEventType.createMany({
		data: mockVenueEventTypes.map((name) => ({ name })),
	})
	console.timeEnd(`🏛️ Created ${mockVenueEventTypes.length} event types...`)

	console.time(`🏛️ Created ${mockVenueTypes.length} venue types...`)
	await prisma.venueType.createMany({
		data: mockVenueTypes.map((name) => ({ name })),
	})
	console.timeEnd(`🏛️ Created ${mockVenueTypes.length} venue types...`)

	console.time(`🏛️ Created ${mockVenueAmenities.length} venue amenities...`)
	await prisma.venueAmenity.createMany({
		data: mockVenueAmenities.map((name) => ({ name })),
	})
	console.timeEnd(`🏛️ Created ${mockVenueAmenities.length} venue amenities...`)

	if (vendors.length < totalVenues) {
		throw new Error(
			`Need at least ${totalVenues} vendors, but found ${vendors.length}`,
		)
	}

	const uniqueVendors = vendors.slice(0, totalVenues)

	for (let index = 0; index < uniqueVendors.length; index++) {
		const vendor = uniqueVendors[index]
		if (!vendor) continue

		console.log(`Creating venue for vendor ${vendor.businessName}...`)

		try {
			const venueTypes = await prisma.venueType.findMany()
			const eventTypes = await prisma.venueEventType.findMany()

			// Generate a unique identifier for this vendor's venue

			const venue = await prisma.venueDetails.create({
				data: {
					vendorId: vendor.id,
					venueTypeId: faker.helpers.arrayElement(venueTypes)?.id,

					spaces: {
						createMany: {
							data: faker.helpers
								.arrayElements(mockVenueSpaces, { min: 1, max: 3 })
								.map((space) => ({
									...space,
								})),
						},
					},

					services: {
						createMany: {
							data: faker.helpers
								.arrayElements(mockVenueServices, { min: 1, max: 3 })
								.map((service, index) => ({
									...service,
									name: `${service.name} ${index + 1}`, // Make service names unique
								})),
						},
					},

					availability: {
						create: {
							date: faker.date.future(),
							available: faker.datatype.boolean(),
						},
					},

					// For amenities, use connect to existing ones only (don't create new ones)
					amenities: {
						connect: faker.helpers
							.arrayElements(mockVenueAmenities, { min: 1, max: 8 })
							.map((name) => ({ name }))
							.filter((amenity) => amenity.name) // Filter out undefined
							.slice(0, 3), // Limit to 3 to avoid constraint issues
					},

					eventTypes: {
						connect: faker.helpers
							.arrayElements(eventTypes, { min: 1, max: 3 })
							.map((type) => ({ id: type.id })),
					},
				},
			})

			console.log(`✅ Created venue for ${vendor.businessName}`)
		} catch (error) {
			console.error(
				`❌ Failed to create venue for ${vendor.businessName}:`,
				error,
			)

			// If creation fails, try to at least connect the vendor to existing amenities
			try {
				await prisma.venueDetails.upsert({
					where: { vendorId: vendor.id },
					update: {},
					create: {
						vendorId: vendor.id,
						venueTypeId: faker.helpers.arrayElement(
							await prisma.venueType.findMany(),
						)?.id,
						// Minimal data to avoid constraints
					},
				})
				console.log(`✅ Created basic venue record for ${vendor.businessName}`)
			} catch (fallbackError) {
				console.error(
					`❌ Even basic venue creation failed for ${vendor.businessName}:`,
					fallbackError,
				)
			}
		}
	}

	console.timeEnd(`🏛️ Created ${totalVenues} venues...`)

	const totalBookings = 5
	console.time(`📅 Created ${totalBookings} bookings...`)
	const bookings = await Promise.all(
		Array.from({ length: totalBookings }, async (_, index) => {
			const user = users[index % users.length]
			if (!user) {
				throw new Error(`User not found for index ${index}`)
			}
			const vendor = vendors[index % vendors.length]
			if (!vendor) {
				throw new Error(`Vendor not found for index ${index}`)
			}
			const bookingDate = faker.date.future()
			return prisma.booking.create({
				data: {
					userId: user.id,
					vendorId: vendor.id,
					date: bookingDate,
					status: 'confirmed',
					totalPrice: faker.number.int({ min: 100, max: 1000 }),
				},
			})
		}),
	)
	console.timeEnd(`📅 Created ${totalBookings} bookings...`)

	console.time(`🐨 Created admin user "alif"`)

	const kodyImages = {
		kodyUser: { objectKey: 'user/kody.png' },
		cuteKoala: {
			altText: 'an adorable koala cartoon illustration',
			objectKey: 'kody-notes/cute-koala.png',
		},
		koalaEating: {
			altText: 'a cartoon illustration of a koala in a tree eating',
			objectKey: 'kody-notes/koala-eating.png',
		},
		koalaCuddle: {
			altText: 'a cartoon illustration of koalas cuddling',
			objectKey: 'kody-notes/koala-cuddle.png',
		},
		mountain: {
			altText: 'a beautiful mountain covered in snow',
			objectKey: 'kody-notes/mountain.png',
		},
		koalaCoder: {
			altText: 'a koala coding at the computer',
			objectKey: 'kody-notes/koala-coder.png',
		},
		koalaMentor: {
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			objectKey: 'kody-notes/koala-mentor.png',
		},
		koalaSoccer: {
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			objectKey: 'kody-notes/koala-soccer.png',
		},
	}

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	const kody = await prisma.user.create({
		select: { id: true },
		data: {
			email: 'alif@shuvodin.dev',
			username: 'alif',
			name: 'Alif',
			password: { create: createPassword('alif') },
			connections: {
				create: {
					providerName: 'github',
					providerId: String(githubUser.profile.id),
				},
			},
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
		},
	})

	await prisma.userImage.create({
		data: {
			userId: kody.id,
			objectKey: kodyImages.kodyUser.objectKey,
		},
	})

	console.timeEnd(`🐨 Created admin user "alif"`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

// we're ok to import from the test directory in this file
/*
eslint
	no-restricted-imports: "off",
*/
