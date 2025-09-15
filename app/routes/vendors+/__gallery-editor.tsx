import {
	type FieldMetadata,
	FormProvider,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Img } from 'openimg/react'
import { useState } from 'react'
import { Form } from 'react-router'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { cn, getVendorImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { type Route } from './onboarding+/+types/gallery'

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

export const GalleryEditorSchema = z.object({
	id: z.string().optional(),
	images: z.array(ImageFieldsetSchema).max(30, 'Maximum 30 images are allowed'),
})

export function GalleryEditor({
	images,
	actionData,
}: {
	images: Route.ComponentProps['loaderData']['images']
	actionData?: Route.ComponentProps['actionData']
}) {
	const isPending = useIsPending()
	const [form, fields] = useForm({
		id: 'gallery-form',
		constraint: getZodConstraint(GalleryEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: GalleryEditorSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const imageList = fields.images.getFieldList()

	return (
		<FormProvider context={form.context}>
			<Form method="post" encType="multipart/form-data" {...getFormProps(form)}>
				<div>
					<ul className="flex flex-col gap-3">
						{imageList.map((imageMeta, index) => {
							const imageMetaId = imageMeta.getFieldset().id.value
							const image = images.find(({ id }) => id === imageMetaId)
							return (
								<li
									key={imageMeta.key}
									className="border-accent flex items-start justify-between gap-3 border-b-2"
								>
									<ImageChooser meta={imageMeta} objectKey={image?.objectKey} />
									<Button
										className="ml-10"
										variant="destructive"
										{...form.remove.getButtonProps({
											name: fields.images.name,
											index,
										})}
									>
										Cancel
										<span className="sr-only">Remove image {index + 1}</span>
									</Button>
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
						size="wide"
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
		<fieldset {...getFieldsetProps(meta)} className="w-full">
			<div className="flex w-full gap-3">
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
				<div className="flex-1">
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
