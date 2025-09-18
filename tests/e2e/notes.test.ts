import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import { expect, test } from '#tests/playwright-utils.ts'

test('Users can create notes', async ({ page, login }) => {
	const user = await login()
	await page.goto(`/users/${user.username}/notes`)

	const newNote = createVendor()
	await page.getByRole('link', { name: /New Note/i }).click()

	// fill in form and submit
	await page.getByRole('textbox', { name: /title/i }).fill(newNote.businessName)
	await page
		.getByRole('textbox', { name: /content/i })
		.fill(newNote.description)

	await page.getByRole('button', { name: /submit/i }).click()
	await expect(page).toHaveURL(new RegExp(`/users/${user.username}/notes/.*`))
})

test('Users can edit notes', async ({ page, login }) => {
	const user = await login()

	const note = await prisma.vendor.create({
		select: { id: true },
		data: { ...createVendor(), ownerId: user.id },
	})
	await page.goto(`/users/${user.username}/notes/${note.id}`)

	// edit the note
	await page.getByRole('link', { name: 'Edit', exact: true }).click()
	const updatedNote = createVendor()
	await page
		.getByRole('textbox', { name: /title/i })
		.fill(updatedNote.businessName)
	await page
		.getByRole('textbox', { name: /content/i })
		.fill(updatedNote.description)
	await page.getByRole('button', { name: /submit/i }).click()

	await expect(page).toHaveURL(`/users/${user.username}/notes/${note.id}`)
	await expect(
		page.getByRole('heading', { name: updatedNote.businessName }),
	).toBeVisible()
})

test('Users can delete notes', async ({ page, login }) => {
	const user = await login()

	const note = await prisma.vendor.create({
		select: { id: true },
		data: { ...createVendor(), ownerId: user.id },
	})
	await page.goto(`/users/${user.username}/notes/${note.id}`)

	// find links with href prefix
	const noteLinks = page
		.getByRole('main')
		.getByRole('list')
		.getByRole('listitem')
		.getByRole('link')
	const countBefore = await noteLinks.count()
	await page.getByRole('button', { name: /delete/i }).click()
	await expect(
		page.getByText('Your note has been deleted.', { exact: true }),
	).toBeVisible()
	await expect(page).toHaveURL(`/users/${user.username}/notes`)
	await expect(noteLinks).toHaveCount(countBefore - 1)
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
	}
}
