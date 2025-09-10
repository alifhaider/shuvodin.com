import { parseWithZod } from '@conform-to/zod'
import { data, type ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { requireVendor } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { VendorDetailsSchema } from './__vendor-types'

export async function action({ request }: ActionFunctionArgs) {
	const { userId, vendorId, vendorType } = await requireVendor(request)
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: VendorDetailsSchema.superRefine(async (data, ctx) => {
			const vendor = await prisma.vendor.findUnique({
				select: { id: true },
				where: { ownerId: userId },
			})
			if (!vendor) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Vendor not found',
				})
			}
		}).transform(async ({ details = [], ...data }) => {
			return {
				...data,
				id: vendorId,
				serviceUpdates: await Promise.all(
					details.filter(imageHasId).map(async (i) => {
						if (imageHasFile(i)) {
							return {
								id: i.id,
								altText: i.altText,
								objectKey: await uploadVendorImage(userId, vendorId, i.file),
							}
						} else {
							return {
								id: i.id,
								altText: i.altText,
							}
						}
					}),
				),
				newServices: await Promise.all(
					services
						.filter(imageHasFile)
						.filter((i) => !i.id)
						.map(async (image) => {
							return {
								altText: image.altText,
								objectKey: await uploadVendorImage(
									userId,
									vendorId,
									image.file,
								),
							}
						}),
				),
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
}
