import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { data, Form } from 'react-router'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.tsx'
import { buttonVariants } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireVendor } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { cn, useIsPending } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type Route as OnboardingLinksRoute } from '../vendors+/onboarding+/+types/links'
import { type Route } from './+types/vendor-links-form'

const LinksSchema = z.object({
	vendorId: z.string(),
	website: z.union([z.string().url('Invalid URL'), z.literal('')]),
	socialLinks: z
		.array(
			z.object({
				platform: z.string().min(1, 'Platform is required').optional(),
				url: z.string().url('Invalid URL').optional(),
			}),
		)
		.optional()
		.default([]),
	latitude: z
		.number()
		.refine((val) => val === undefined || (val >= -90 && val <= 90), {
			message: 'Latitude must be between -90 and 90',
		})
		.or(
			z.string().refine((val) => val === '' || !isNaN(Number(val)), {
				message: 'Latitude must be a number',
			}),
		)
		.optional(),
	longitude: z
		.union([
			z
				.number()
				.refine((val) => val >= -180 && val <= 180, {
					message: 'Longitude must be between -180 and 180',
				})
				.optional(),
			z.string().refine((val) => val === '' || !isNaN(Number(val)), {
				message: 'Longitude must be a number',
			}),
		])
		.optional(),
})

export async function action({ request }: Route.ActionArgs) {
	const { userId, vendorId, slug } = await requireVendor(request)
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: LinksSchema.superRefine(async (data, ctx) => {
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
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { website, socialLinks, latitude, longitude } = submission.value

	console.log({ latitude, longitude, website })

	await prisma.vendor.update({
		where: { id: vendorId, ownerId: userId },
		data: {
			website,
			socialLinks: socialLinks || [],
			latitude: latitude ? parseFloat(String(latitude)) : null,
			longitude: longitude ? parseFloat(String(longitude)) : null,
		},
	})

	return redirectWithToast(`/vendors/${slug}`, {
		type: 'success',
		title: 'Vendor Profile Updated',
		description: 'Your Vendor profile has been successfully updated.',
	})
}

export function VendorLinksForm({
	loaderData,
	actionData,
}: {
	actionData: Route.ComponentProps['actionData']
	loaderData: OnboardingLinksRoute.ComponentProps['loaderData']
}) {
	const isPending = useIsPending()
	const [form, fields] = useForm({
		id: 'vendor-links-form',
		lastResult: actionData?.result,
		defaultValue: {
			vendorId: loaderData.vendorId,
			website: loaderData.vendor.website,
			socialLinks: (Array.isArray(loaderData.vendor.socialLinks)
				? loaderData.vendor.socialLinks
				: []) as { platform?: string | null; url?: string | null }[],
			latitude: loaderData.vendor.latitude,
			longitude: loaderData.vendor.longitude,
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LinksSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const socialLinks = fields.socialLinks.getFieldList()

	return (
		<Form
			{...getFormProps(form)}
			method="POST"
			action="/resources/vendor-links-form"
		>
			<input type="hidden" name="vendorId" value={loaderData.vendorId} />

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<Input
						placeholder="Website URL"
						defaultValue={fields.website.value}
						{...getInputProps(fields.website, {
							type: 'url',
						})}
					/>
					<ErrorList errors={fields.website.errors} />
				</div>
				<div>
					<Input
						placeholder="Latitude"
						defaultValue={fields.latitude.value}
						{...getInputProps(fields.latitude, {
							type: 'number',
						})}
					/>
					<ErrorList errors={fields.latitude.errors} />
				</div>
				<div>
					<Input
						placeholder="Longitude"
						defaultValue={fields.longitude.value}
						{...getInputProps(fields.longitude, {
							type: 'number',
						})}
					/>
					<ErrorList errors={fields.longitude.errors} />
				</div>
			</div>

			<div className="mt-4">
				<label className="block text-sm font-medium text-gray-700">
					Social Links
				</label>
				<AnimatePresence initial={false}>
					{socialLinks.map((link, index) => {
						const linkFields = link.getFieldset()
						return (
							<AnimateHeight key={index}>
								<fieldset className="mt-1 grid grid-cols-1 items-center gap-4 md:grid-cols-5">
									<div className="md:col-span-2">
										<Input
											placeholder="Platform (e.g., Instagram)"
											defaultValue={linkFields.platform.value || ''}
											{...getInputProps(linkFields.platform, {
												type: 'text',
											})}
										/>
										<ErrorList errors={linkFields.platform.errors} />
									</div>
									<div className="md:col-span-2">
										<Input
											placeholder="URL"
											defaultValue={linkFields.url.value || ''}
											{...getInputProps(linkFields.url, {
												type: 'url',
											})}
										/>
										<ErrorList errors={linkFields.url.errors} />
									</div>
									<div className="flex items-center justify-end md:col-span-1">
										<button
											className={cn(
												buttonVariants({
													variant: 'destructive',
													size: 'icon',
												}),
												'mb-[10px]',
											)}
											{...form.remove.getButtonProps({
												name: fields.socialLinks.name,
												index,
											})}
										>
											<Icon name="trash" className="h-4 w-4" />
										</button>
									</div>
								</fieldset>
							</AnimateHeight>
						)
					})}
				</AnimatePresence>
				<ErrorList errors={fields.socialLinks.errors} />

				<button
					className={cn(
						buttonVariants({ variant: 'outline', size: 'sm' }),
						'mt-4',
					)}
					{...form.insert.getButtonProps({
						name: fields.socialLinks.name,
					})}
				>
					<Icon name="plus" className="mr-2 h-4 w-4" /> Add Social Link
				</button>
			</div>

			<div className="mt-8 flex justify-end">
				<StatusButton
					type="submit"
					disabled={isPending}
					size="wide"
					status={isPending ? 'pending' : 'idle'}
				>
					<span>Complete</span>
				</StatusButton>
			</div>
		</Form>
	)
}

const AnimateHeight = ({ children }: { children: React.ReactNode }) => {
	return (
		<motion.div
			initial={{ height: 0, opacity: 0 }}
			animate={{ height: 'auto', opacity: 1 }}
			exit={{ height: 0, opacity: 0 }}
			transition={{ duration: 0.3 }}
			className="overflow-hidden"
		>
			{children}
		</motion.div>
	)
}
