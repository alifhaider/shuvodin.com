import { parseWithZod } from '@conform-to/zod'
import { data } from 'react-router'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { type Route } from './+types/favorite-vendor-form'

const FavoriteVendorFormSchema = z.object({
	vendorId: z.string().min(1),
})

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: FavoriteVendorFormSchema.superRefine(async (data, ctx) => {
			const vendor = await prisma.vendor.findUnique({
				select: { id: true },
				where: { id: data.vendorId },
			})
			if (!vendor) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Vendor not found',
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { vendorId } = submission.value

	// Check if the vendor is already in user's favorites then remove from favorites
	const existingFavorite = await prisma.user.findFirst({
		where: {
			id: userId,
			favorites: {
				some: { id: vendorId },
			},
		},
	})

	if (existingFavorite) {
		await prisma.user.update({
			where: { id: userId },
			data: {
				favorites: {
					disconnect: { id: vendorId },
				},
			},
		})
		return data(
			{ success: true, result: submission.reply() },
			{
				headers: await createToastHeaders({
					description: 'Vendor removed from favorites successfully',
					type: 'success',
				}),
			},
		)
	}

	await prisma.user.update({
		where: { id: userId },
		data: {
			favorites: {
				connect: { id: vendorId },
			},
		},
	})

	return data(
		{ success: true, result: submission.reply() },
		{
			headers: await createToastHeaders({
				description: 'Vendor added to favorites successfully',
				type: 'success',
			}),
		},
	)
}
