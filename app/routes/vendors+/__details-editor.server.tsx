import { parseWithZod } from '@conform-to/zod'
import { data, redirect, type ActionFunctionArgs } from 'react-router'
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
				serviceUpdates: await Promise.all([]),
				newServices: await Promise.all([]),
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

	const { id, serviceUpdates = [], newServices = [] } = submission.value

	await prisma.vendor.update({
		select: { id: true, owner: { select: { username: true } } },
		where: { id, ownerId: userId },
		data: {
			gallery: {
				deleteMany: { id: { notIn: [] } },
				updateMany: serviceUpdates,
				create: newServices,
			},
		},
	})

	console.log('Vendor updated successfully')
	return redirect('/vendors/onboarding/details')
}
