import { faker } from '@faker-js/faker'
import { type Vendor, type VendorImage } from '@prisma/client'
import { prisma } from '#app/utils/db.server.ts'
import { expect, test } from '#tests/playwright-utils.ts'

test('Users can create note with an image', async ({ page, login }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createVendor()
	const altText = 'cute koala'
	await page.getByRole('link', { name: 'new note' }).click()

	// fill in form and submit
	await page.getByRole('textbox', { name: 'title' }).fill(newNote.businessName)
	await page.getByRole('textbox', { name: 'content' }).fill(newNote.description)
	await page
		.getByLabel('image')
		.nth(0)
		.setInputFiles('tests/fixtures/images/kody-notes/cute-koala.png')
	await page.getByRole('textbox', { name: 'alt text' }).fill(altText)

	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(
		page.getByRole('heading', { name: newNote.businessName }),
	).toBeVisible()
	await expect(
		page
			.getByRole('region', { name: newNote.businessName })
			.getByAltText(altText),
	).toBeVisible()
})

test('Users can create note with multiple images', async ({ page, login }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createVendor()
	const altText1 = 'cute koala'
	const altText2 = 'koala coder'
	await page.getByRole('link', { name: 'new note' }).click()

	// fill in form and submit
	await page.getByRole('textbox', { name: 'title' }).fill(newNote.businessName)
	await page.getByRole('textbox', { name: 'content' }).fill(newNote.description)
	await page
		.getByLabel('image')
		.nth(0)
		.setInputFiles('tests/fixtures/images/kody-notes/cute-koala.png')
	await page.getByLabel('alt text').nth(0).fill(altText1)
	await page.getByRole('button', { name: 'add image' }).click()

	await page
		.getByLabel('image')
		.nth(1)
		.setInputFiles('tests/fixtures/images/kody-notes/koala-coder.png')
	await page.getByLabel('alt text').nth(1).fill(altText2)

	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
	await expect(
		page.getByRole('heading', { name: newNote.businessName }),
	).toBeVisible()
	await expect(page.getByAltText(altText1)).toBeVisible()
	await expect(page.getByAltText(altText2)).toBeVisible()
})

test('Users can edit note image', async ({ page, login }) => {
	const user = await login()

	const note = await prisma.vendor.create({
		select: { id: true },
		data: {
			...createVendorWithImage(),
			ownerId: user.id,
		},
	})
	await page.goto(`/users/${user.username}/notes/${note.id}`)

	// edit the image
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	const updatedImage = {
		altText: 'koala coder',
		location: 'tests/fixtures/images/kody-notes/koala-coder.png',
	}
	await page.getByLabel('image').nth(0).setInputFiles(updatedImage.location)
	await page.getByLabel('alt text').nth(0).fill(updatedImage.altText)
	await page.getByRole('button', { name: 'submit' }).click()

	await expect(page).toHaveURL(`/users/${user.username}/notes/${note.id}`)
	await expect(page.getByAltText(updatedImage.altText)).toBeVisible()
})

test('Users can delete note image', async ({ page, login }) => {
	const user = await login()

	const note = await prisma.vendor.create({
		select: { id: true, businessName: true },
		data: {
			...createVendorWithImage(),
			ownerId: user.id,
		},
	})
	await page.goto(`/users/${user.username}/notes/${note.id}`)

	await expect(
		page.getByRole('heading', { name: note.businessName }),
	).toBeVisible()
	const images = page
		.getByRole('region', { name: note.businessName })
		.getByRole('list')
		.getByRole('listitem')
		.getByRole('img')
	await expect(images).toHaveCount(1)
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	await page.getByRole('button', { name: 'remove image' }).click()
	await page.getByRole('button', { name: 'submit' }).click()
	await expect(page).toHaveURL(`/users/${user.username}/notes/${note.id}`)
	await expect(images).toHaveCount(0)
})

function createVendor() {
	return {
		businessName: faker.lorem.words(3),
		description: faker.lorem.paragraphs(3),
		slug: faker.lorem.words(3).toLowerCase().replace(/\s+/g, '-'),
		address: faker.location.streetAddress(),
		division: 'Dhaka',
		district: 'Dhaka',
		thana: 'Dhanmondi',
		vendorTypeId: '1',
		mapUrl: '',
		socialLinks: [],
		phone: faker.phone.number(),
		isFeatured: false,
		website: faker.internet.url(),
		rating: 0,
		latitude: 0,
		longitude: 0,
		dailyBookingLimit: 1,
	} satisfies Omit<
		Vendor,
		'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'type'
	>
}

function createVendorWithImage() {
	return {
		...createVendor(),
		gallery: {
			create: {
				altText: 'cute koala',
				objectKey: 'kody-notes/cute-koala.png',
			},
		},
	} satisfies Omit<
		Vendor,
		'id' | 'createdAt' | 'updatedAt' | 'type' | 'ownerId'
	> & {
		gallery: {
			create: Pick<VendorImage, 'altText' | 'objectKey'>
		}
	}
}
