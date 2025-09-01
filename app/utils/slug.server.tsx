import { prisma } from './db.server'

export async function generateSlug(name: string) {
	const primarySlug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')

	const existingSlugs = await prisma.vendor.findMany({
		where: {
			slug: {
				startsWith: primarySlug,
			},
		},
		select: { slug: true },
	})
	if (!existingSlugs) return primarySlug
	const slugSet = new Set(existingSlugs.map((vendor) => vendor.slug))
	if (!slugSet.has(primarySlug)) return primarySlug
	let suffix = 1
	while (slugSet.has(`${primarySlug}-${suffix}`)) {
		suffix++
	}
	return `${primarySlug}-${suffix}`
}
