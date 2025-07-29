import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	createPassword,
	createUser,
	getNoteImages,
	getUserImages,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'

const mockVendorCategories = [
	'Photographers',
	'Venues',
	'Makeup Artists',
	'Decorators',
	'Caterers',
]

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
	await prisma.booking.deleteMany({})
	await prisma.package.deleteMany({})
	await prisma.review.deleteMany({})
	await prisma.vendor.deleteMany({})
	await prisma.vendorCategory.deleteMany({})
	await prisma.userImage.deleteMany({})
	await prisma.user.deleteMany({})
	await prisma.password.deleteMany({})
	await prisma.session.deleteMany({})
	await prisma.connection.deleteMany({})
	await prisma.role.deleteMany({})

	console.timeEnd(`🌱 Clearing existing data...`)

	console.time(`🌱 Database has been seeded`)

	await prisma.booking.deleteMany({})
	await prisma.package.deleteMany({})
	await prisma.review.deleteMany({})
	await prisma.vendor.deleteMany({})
	await prisma.vendorCategory.deleteMany({})
	await prisma.userImage.deleteMany({})
	await prisma.user.deleteMany({})
	await prisma.password.deleteMany({})
	await prisma.session.deleteMany({})
	await prisma.connection.deleteMany({})
	await prisma.role.deleteMany({})

	const totalVendorCategories = mockVendorCategories.length
	console.time(`📦 Created ${totalVendorCategories} vendor categories...`)
	for (const name of mockVendorCategories) {
		await prisma.vendorCategory.create({
			data: { name, description: faker.lorem.paragraph() },
		})
	}
	console.timeEnd(`📦 Created ${totalVendorCategories} vendor categories...`)

	await prisma.role.createMany({
		data: [{ name: 'user' }, { name: 'vendor' }, { name: 'admin' }],
	})

	const totalUsers = 5
	console.time(`👤 Created ${totalUsers} users...`)
	const userImages = await getUserImages()

	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		const user = await prisma.user.create({
			select: { id: true },
			data: {
				...userData,
				password: { create: createPassword(userData.username) },
				roles: { connect: { name: 'user' } },
			},
		})

		// Upload user profile image
		const userImage = userImages[index % userImages.length]
		if (userImage) {
			await prisma.userImage.create({
				data: {
					userId: user.id,
					objectKey: userImage.objectKey,
				},
			})
		}

		const vendorCategories = await prisma.vendorCategory.findMany()
		const vendor = await prisma.vendor.create({
			data: {
				businessName: faker.company.name(),
				description: faker.lorem.paragraph(),
				ownerId: user.id,
				categoryId: faker.helpers.arrayElement(vendorCategories)?.id,
				phone: faker.phone.number(),
				website: faker.internet.url(),
				location: { create: faker.helpers.arrayElement(mockVendorLocations) },
				profileImage: {
					create: {
						objectKey: userImage?.objectKey ?? 'default-profile-image.png',
					},
				},
				coverImage: {
					create: {
						objectKey: 'default-cover-image.png',
					},
				},

				gallery: {
					create: await getNoteImages().then((images) =>
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

		const packages = await prisma.package.findMany()

		await prisma.booking.create({
			data: {
				userId: user.id,
				vendorId: vendor.id,
				date: faker.date.future(),
				status: 'pending',
				totalPrice: faker.number.int({ min: 100, max: 1000 }),
				message: faker.lorem.sentence(),
				packageId: faker.helpers.arrayElement(packages)?.id,
			},
		})
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`)

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
