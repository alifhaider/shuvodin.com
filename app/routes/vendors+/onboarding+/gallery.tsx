import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireVendorId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { GalleryEditor } from '../__gallery-editor'
import { type Route } from './+types/gallery'

export { action } from '../__gallery-editor.server'

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

export const GallerySchema = z.object({
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
	return { images: vendor.gallery }
}

export default function OnboardingGallery({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { images } = loaderData

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
