import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
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
		city: 'Dhaka',
		address: '123 Main St, Dhaka',
	},
	{
		city: 'Chittagong',
		address: '456 Elm St, Chittagong',
	},
	{
		city: 'Sylhet',
		address: '789 Oak St, Sylhet',
	},
]

async function seed() {
	console.log('🌱 Seeding...')

	console.time(`🌱 Clearing existing data...`)
	await prisma.photographyStyle.deleteMany({})
	await prisma.photographyService.deleteMany({})
	await prisma.photographerDetails.deleteMany({})
	await prisma.venueDetails.deleteMany({})
	await prisma.catererDetails.deleteMany({})
	await prisma.catererMealService.deleteMany({})
	await prisma.catererBeverageService.deleteMany({})
	await prisma.catererMenuItem.deleteMany({})
	await prisma.catererAward.deleteMany({})
	await prisma.catererServedCity.deleteMany({})
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
				name: 'Photographer',
				description: 'Professional photography services',
			},
			{
				name: 'Beauty Professional',
				description: 'Makeup and beauty services',
			},
			{ name: 'Venue', description: 'Event venues and locations' },
		],
	})
	console.timeEnd('📦 Creating vendor types...')

	const vendorTypes = await prisma.vendorType.findMany()

	console.time('📷 Creating photographer vendors...')
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

	const photographerAwards = [
		'Best Wedding Photographer 2025',
		'Top 10 Photographers in the City',
		'Excellence in Photography Award',
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

	const totalPhotographyStyles = photographyStyles.length
	console.time(`📷 Creating ${totalPhotographyStyles} photography styles...`)
	await prisma.photographyStyle.createMany({
		data: photographyStyles.map((style) => ({ name: style })),
	})
	console.timeEnd(`📷 Created ${totalPhotographyStyles} photography styles...`)

	const totalPhotographyServices = photographyServices.length
	console.time(
		`📷 Creating ${totalPhotographyServices} photography services...`,
	)
	await prisma.photographyService.createMany({
		data: photographyServices.map((service) => ({ name: service })),
	})
	console.timeEnd(
		`📷 Created ${totalPhotographyServices} photography services...`,
	)

	const totalVendors = 10
	console.time(`📷 Creating ${totalVendors} vendors...`)
	const vendors = await Promise.all(
		Array.from({ length: totalVendors }, async (_, index) => {
			const user = users[index % users.length]
			if (!user) {
				throw new Error(`User not found for index ${index}`)
			}
			const vendor = await prisma.vendor.create({
				data: {
					businessName: faker.company.name(),
					description: faker.lorem.paragraph(),
					ownerId: user.id,
					vendorTypeId: faker.helpers.arrayElement(vendorTypes)?.id,
					phone: faker.phone.number(),
					website: faker.internet.url(),

					location: { create: faker.helpers.arrayElement(mockVendorLocations) },
					isFeatured: faker.datatype.boolean(),
					profileImage: {
						create: {
							objectKey:
								userImages[index % userImages.length]?.objectKey ??
								'default-profile-image.png',
							altText: faker.lorem.sentence(),
						},
					},
					coverImage: {
						create: {
							objectKey: 'default-cover-image.png',
							altText: faker.lorem.sentence(),
						},
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

	const totalPhotographers = 5
	console.time(`📷 Created ${totalPhotographers} photographers...`)
	const photographers = await Promise.all(
		Array.from({ length: totalPhotographers }, async (_, index) => {
			if (index >= vendors.length) {
				throw new Error(
					`Not enough vendors to create ${totalPhotographers} photographers`,
				)
			}
			const vendor = vendors[index]
			if (!vendor) {
				throw new Error(`Vendor not found for index ${index}`)
			}
			const photographer = await prisma.photographerDetails.create({
				data: {
					vendorId: vendor.id,
					styles: {
						connect: faker.helpers
							.arrayElements(await prisma.photographyStyle.findMany(), {
								min: 1,
								max: 3,
							})
							.map((style) => ({ name: style.name })),
					},
					services: {
						connect: faker.helpers
							.arrayElements(await prisma.photographyService.findMany(), {
								min: 1,
								max: 3,
							})
							.map((service) => ({ name: service.name })),
					},
					additionalFee: faker.datatype.boolean(),
					additionalFeeRate: faker.number.int({ min: 50, max: 500 }),
					additionalInfo: faker.lorem.paragraph(),
					minPrice: faker.number.int({ min: 1000, max: 5000 }),
					maxPrice: faker.number.int({ min: 5000, max: 20000 }),
					servedCities: {
						create: faker.helpers
							.arrayElements(mockVendorLocations, { min: 1, max: 3 })
							.map((location) => ({
								city: location.city,
								isBaseCity: location.city === 'Dhaka',
								hasAdditionalFee: faker.datatype.boolean(),
							})),
					},

					awards: {
						create: faker.helpers
							.arrayElements(photographerAwards, { min: 1, max: 2 })
							.map((award) => ({
								name: award,
								year: faker.date.past().getFullYear(),
							})),
					},
				},
			})

			return photographer
		}),
	)

	console.timeEnd(`📷 Created ${totalPhotographers} photographers...`)

	const totalVenues = 5
	console.time(`🏛️ Created ${totalVenues} venues...`)
	const venueTypes = [
		'Ballroom',
		'Garden',
		'Hotel',
		'Barn',
		'Vineyard',
		'Beach',
		'Rooftop',
		'Warehouse',
		'Mansion',
		'Restaurant',
	]
	const amenities = [
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
	const eventTypes = [
		'Wedding',
		'Corporate',
		'Birthday',
		'Anniversary',
		'Conference',
		'Gala',
		'Fundraiser',
		'Graduation',
	]

	await Promise.all(
		venueTypes.map((name) =>
			prisma.venueType.upsert({
				where: { name },
				create: { name },
				update: {},
			}),
		),
	)

	await Promise.all(
		amenities.map((name) =>
			prisma.venueAmenity.upsert({
				where: { name },
				create: { name },
				update: {},
			}),
		),
	)

	await Promise.all(
		eventTypes.map((name) =>
			prisma.venueEventType.upsert({
				where: { name },
				create: { name },
				update: {},
			}),
		),
	)

	await Promise.all(
		Array.from({ length: totalVenues }, async (_, index) => {
			const vendor = vendors[index % vendors.length]
			if (!vendor) {
				throw new Error(`Vendor not found for index ${index}`)
			}

			const selectedVenueType = faker.helpers.arrayElement(venueTypes)
			const selectedAmenities = faker.helpers.arrayElements(amenities, {
				min: 1,
				max: 3,
			})
			const selectedEventTypes = faker.helpers.arrayElements(eventTypes, {
				min: 1,
				max: 3,
			})
			const awards = faker.helpers.arrayElements(
				['Best Venue 2025', 'Top Rated Venue'],
				{ min: 1, max: 2 },
			)
			const venue = await prisma.venueDetails.create({
				data: {
					vendorId: vendor.id,
					availability: {
						create: {
							date: faker.date.future(),
							available: faker.datatype.boolean(),
						},
					},

					minCapacity: faker.number.int({ min: 50, max: 200 }),
					maxCapacity: faker.number.int({ min: 200, max: 1000 }),
					venueType: {
						connect: { name: selectedVenueType },
					},
					amenities: {
						connect: selectedAmenities.map((name) => ({ name })),
					},
					eventTypes: {
						connect: selectedEventTypes.map((name) => ({ name })),
					},
					awards: {
						create: awards.map((name) => ({
							name,
							year: faker.date.past().getFullYear(),
						})),
					},
					minPrice: faker.number.int({ min: 1000, max: 5000 }),
					maxPrice: faker.number.int({ min: 5000, max: 20000 }),
					indoor: faker.datatype.boolean(),
					outdoor: faker.datatype.boolean(),
					parkingAvailable: faker.datatype.boolean(),
					smokingAllowed: faker.datatype.boolean(),
					wheelchairAccess: faker.datatype.boolean(),
				},
			})
			return venue
		}),
	)
	console.timeEnd(`🏛️ Created ${totalVenues} venues...`)

	const totalBookings = 5
	console.time(`📅 Creating ${totalBookings} bookings...`)
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

	console.time(`🐨 Created admin user "Alif"`)

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
