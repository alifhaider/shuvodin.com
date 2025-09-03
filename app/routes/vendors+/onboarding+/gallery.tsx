import {
	type FieldMetadata,
	FormProvider,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { parseFormData } from '@mjackson/form-data-parser'
import { createId as cuid } from '@paralleldrive/cuid2'
import { Img } from 'openimg/react'
import { useState } from 'react'
import { data, Form, redirect } from 'react-router'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { requireUserId, requireVendorId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getVendorImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { uploadVendorImage } from '#app/utils/storage.server.ts'
import { type Route } from './+types/gallery'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'

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
	const isPending = useIsPending()
	const { vendorId, images } = loaderData
	const [form, fields] = useForm({
		id: 'gallery-form',
		constraint: getZodConstraint(GallerySchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: GallerySchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const imageList = fields.images.getFieldList()

	return (
		<FormProvider context={form.context}>
			<Form method="post" encType="multipart/form-data" {...getFormProps(form)}>
				<div>
					<Label>Images</Label>
					<ul className="flex flex-col gap-4">
						{imageList.map((imageMeta, index) => {
							const imageMetaId = imageMeta.getFieldset().id.value
							const image = images.find(({ id }) => id === imageMetaId)
							return (
								<li
									key={imageMeta.key}
									className="border-muted-foreground relative border-b-2"
								>
									<button
										className="text-foreground-destructive absolute top-0 right-0"
										{...form.remove.getButtonProps({
											name: fields.images.name,
											index,
										})}
									>
										<span aria-hidden>
											<Icon name="cross-1" />
										</span>{' '}
										<span className="sr-only">Remove image {index + 1}</span>
									</button>
									<ImageChooser meta={imageMeta} objectKey={image?.objectKey} />
								</li>
							)
						})}
					</ul>
					<Button
						className="mt-3"
						{...form.insert.getButtonProps({ name: fields.images.name })}
					>
						<span aria-hidden>
							<Icon name="plus">Image</Icon>
						</span>{' '}
						<span className="sr-only">Add image</span>
					</Button>
				</div>
				<div className="mt-8 flex justify-end">
					<StatusButton
						type="submit"
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						<span>Next</span>
					</StatusButton>
				</div>
			</Form>
		</FormProvider>
	)
}

function ImageChooser({
	meta,
	objectKey,
}: {
	meta: FieldMetadata<ImageFieldset>
	objectKey: string | undefined
}) {
	const fields = meta.getFieldset()
	const existingImage = Boolean(fields.id.initialValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		objectKey ? getVendorImgSrc(objectKey) : null,
	)
	const [altText, setAltText] = useState(fields.altText.initialValue ?? '')

	return (
		<fieldset {...getFieldsetProps(meta)}>
			<div className="flex gap-3">
				<div className="w-32">
					<div className="relative size-32">
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute size-32 rounded-lg', {
								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-2': !existingImage,
							})}
						>
							{previewImage ? (
								<div className="relative">
									{existingImage ? (
										<Img
											src={previewImage}
											alt={altText ?? ''}
											className="size-32 rounded-lg object-cover"
											width={512}
											height={512}
										/>
									) : (
										<img
											src={previewImage}
											alt={altText ?? ''}
											className="size-32 rounded-lg object-cover"
										/>
									)}
									{existingImage ? null : (
										<div className="bg-primary text-secondary-foreground pointer-events-none absolute -top-0.5 -right-0.5 rotate-12 rounded-sm px-2 py-1 text-xs shadow-md">
											new
										</div>
									)}
								</div>
							) : (
								<div className="border-muted-foreground text-muted-foreground flex size-32 items-center justify-center rounded-lg border text-4xl">
									<Icon name="plus" />
								</div>
							)}
							{existingImage ? (
								<input
									{...getInputProps(fields.id, { type: 'hidden' })}
									key={fields.id.key}
								/>
							) : null}
							<input
								aria-label="Image"
								className="absolute top-0 left-0 z-0 size-32 cursor-pointer opacity-0"
								onChange={(event) => {
									const file = event.target.files?.[0]

									if (file) {
										const reader = new FileReader()
										reader.onloadend = () => {
											setPreviewImage(reader.result as string)
										}
										reader.readAsDataURL(file)
									} else {
										setPreviewImage(null)
									}
								}}
								accept="image/*"
								{...getInputProps(fields.file, { type: 'file' })}
								key={fields.file.key}
							/>
						</label>
					</div>
					<div className="min-h-[32px] px-4 pt-1 pb-3">
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
				<div className="max-w-sm flex-1">
					<Label htmlFor={fields.altText.id}>Alt Text</Label>
					<Input
						onChange={(e) => setAltText(e.currentTarget.value)}
						{...getInputProps(fields.altText, { type: 'text' })}
						key={fields.altText.key}
					/>
					<div className="min-h-[32px] px-4 pt-1 pb-3">
						<ErrorList
							id={fields.altText.errorId}
							errors={fields.altText.errors}
						/>
					</div>
				</div>
			</div>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				<ErrorList id={meta.errorId} errors={meta.errors} />
			</div>
		</fieldset>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No note with the id "{params.noteId}" exists</p>
				),
			}}
		/>
	)
}
