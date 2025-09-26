import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { data, useFetcher, useFetchers } from 'react-router'
import { z } from 'zod'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
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
					description: 'Vendor removed from shortlist!',
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
				description: 'Vendor shortlisted!',
				type: 'success',
			}),
		},
	)
}

/**
 * If the user's changing their favorite preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticFavoritePreference() {
	const fetchers = useFetchers()
	const favoriteFetcher = fetchers.find(
		(f) => f.formAction === '/resources/favorite-vendor-form',
	)

	if (favoriteFetcher && favoriteFetcher.formData) {
		const submission = parseWithZod(favoriteFetcher.formData, {
			schema: FavoriteVendorFormSchema,
		})

		if (submission.status === 'success') {
			return submission.value.vendorId
		}
	}
}

export function FavoriteVendorForm({
	vendorId,
	isFavorited,
}: {
	vendorId: string
	isFavorited: boolean
}) {
	const fetcher = useFetcher<typeof action>()
	const [form] = useForm({
		id: 'favorite-vendor-form',
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: FavoriteVendorFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<fetcher.Form
			method="POST"
			{...getFormProps(form)}
			action="/resources/favorite-vendor-form"
		>
			<input type="hidden" name="vendorId" value={vendorId} />
			<Button
				variant="ghost"
				type="submit"
				className={cn(
					'hover:text-primary aspect-square rounded-full fill-transparent p-2',
					{
						'text-primary fill-primary': isFavorited,
					},
				)}
			>
				<span className="sr-only">Favorite</span>
				<Icon name="heart" className="h-4 w-4" />
			</Button>
		</fetcher.Form>
	)
}
