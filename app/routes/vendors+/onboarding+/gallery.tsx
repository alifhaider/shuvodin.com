import { parseWithZod } from '@conform-to/zod'
import { parseFormData } from '@mjackson/form-data-parser'
import { createId as cuid } from '@paralleldrive/cuid2'
import { data, redirect } from 'react-router'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId, requireVendorId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { uploadVendorImage } from '#app/utils/storage.server.ts'
import { GalleryEditor } from '../__gallery-editor'

import { type Route } from './+types/gallery'

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

export const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.optional()
		.refine((file) => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, 'File size must be less than 3MB'),
	altText: z.string().optional(),
})

export type ImageFieldset = z.infer<typeof ImageFieldsetSchema>

function imageHasId(
	image: ImageFieldset,
): image is ImageFieldset & { id: string } {
	return Boolean(image.id)
}

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}

const GallerySchema = z.object({
	vendorId: z.string().optional(),
	images: z.array(ImageFieldsetSchema).max(30, 'Maximum 30 images are allowed'),
})

export async function loader({ request }: Route.LoaderArgs) {
	const vendorId = await requireVendorId(request)
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId },
		select: {
			id: true,
			gallery: { select: { id: true, objectKey: true, altText: true } },
		},
	})
	if (!vendor) {
		throw new Response('Not Found', { status: 404 })
	}
	return { vendorId, images: vendor.gallery }
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await parseFormData(request, {
		maxFileSize: MAX_UPLOAD_SIZE,
	})

	const submission = await parseWithZod(formData, {
		schema: GallerySchema.superRefine(async (data, ctx) => {
			if (!data.vendorId) return

			const vendor = await prisma.vendor.findUnique({
				select: { id: true },
				where: { id: data.vendorId, ownerId: userId },
			})
			if (!vendor) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Vendor not found',
				})
			}
		}).transform(async ({ images = [], ...data }) => {
			const vendoId = data.vendorId ?? cuid()
			return {
				...data,
				id: vendoId,
				imageUpdates: await Promise.all(
					images.filter(imageHasId).map(async (i) => {
						if (imageHasFile(i)) {
							return {
								id: i.id,
								altText: i.altText,
								objectKey: await uploadVendorImage(userId, vendoId, i.file),
							}
						} else {
							return {
								id: i.id,
								altText: i.altText,
							}
						}
					}),
				),
				newImages: await Promise.all(
					images
						.filter(imageHasFile)
						.filter((i) => !i.id)
						.map(async (image) => {
							return {
								altText: image.altText,
								objectKey: await uploadVendorImage(userId, vendoId, image.file),
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

	const { id: vendorId, imageUpdates = [], newImages = [] } = submission.value

	await prisma.vendor.update({
		select: { id: true, owner: { select: { username: true } } },
		where: { id: vendorId },
		data: {
			gallery: {
				deleteMany: { id: { notIn: imageUpdates.map((i) => i.id) } },
				updateMany: imageUpdates.map((updates) => ({
					where: { id: updates.id },
					data: {
						...updates,
						id: updates.objectKey ? cuid() : updates.id,
					},
				})),
				create: newImages,
			},
		},
	})

	return redirect('/vendors/onboarding/services')
}

export default function OnboardingGallery({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { vendorId, images } = loaderData

	return <GalleryEditor images={images} actionData={actionData} />
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => (
					<div className="p-4">
						<h1 className="mb-4 text-2xl font-bold">Vendor Not Found</h1>
						<p>
							We could not find the vendor you are looking for. Please check the
							URL and try again.
						</p>
					</div>
				),
			}}
		/>
	)
}
