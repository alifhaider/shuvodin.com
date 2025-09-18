import {
	FormProvider,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { useEffect } from 'react'
import { data, Form, redirect } from 'react-router'
import { z } from 'zod'
import { CheckboxField, ErrorList } from '#app/components/forms.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { RadioGroup, RadioGroupItem } from '#app/components/ui/radio-group.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireVendor } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import {
	getServiceDescriptionByServiceName,
	VenueDetailsSchema,
} from '../vendors+/__vendor-utils'
import { type Route as OnboardingDetailsRoute } from '../vendors+/onboarding+/+types/details'
import { type VenueOptions } from '../vendors+/onboarding+/details'
import { type Route } from './+types/venue-details-form'

export async function action({ request }: Route.ActionArgs) {
	console.log('action called')
	const { userId, vendorId } = await requireVendor(request)
	const formData = await request.formData()

	console.log('Form Data:', Array.from(formData.entries()))

	const submission = await parseWithZod(formData, {
		schema: VenueDetailsSchema.superRefine(async (data, ctx) => {
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

			const venueType = await prisma.venueType.findUnique({
				select: { id: true },
				where: { id: data.venueTypeId },
			})
			if (!venueType) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Invalid venue type',
				})
			}

			const serviceIds = data.services.map((s) => s.globalServiceId)
			const validServiceIds = await prisma.globalVenueService
				.findMany({
					where: { id: { in: serviceIds } },
					select: { id: true },
				})
				.then((services) => services.map((s) => s.id))
			const invalidServiceIds = serviceIds.filter(
				(id) => !validServiceIds.includes(id),
			)
			if (invalidServiceIds.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid service IDs: ${invalidServiceIds.join(', ')}`,
				})
			}

			if (data.vendorType !== 'venue') {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Invalid vendor type',
				})
			}

			const spaceIds = data.spaces.map((s) => s.globalSpaceId)
			const validSpaceIds = await prisma.globalVenueSpace
				.findMany({
					where: { id: { in: spaceIds } },
					select: { id: true },
				})
				.then((spaces) => spaces.map((s) => s.id))
			const invalidSpaceIds = spaceIds.filter(
				(id) => !validSpaceIds.includes(id),
			)
			if (invalidSpaceIds.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid space IDs: ${invalidSpaceIds.join(', ')}`,
				})
			}

			const eventTypeIds = data.eventTypes.map((e) => e.globalEventTypeId)
			const validEventTypeIds = await prisma.globalVenueEventType
				.findMany({
					where: { id: { in: eventTypeIds } },
					select: { id: true },
				})
				.then((eventTypes) => eventTypes.map((e) => e.id))
			const invalidEventTypeIds = eventTypeIds.filter(
				(id) => !validEventTypeIds.includes(id),
			)
			if (invalidEventTypeIds.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid event type IDs: ${invalidEventTypeIds.join(', ')}`,
				})
			}

			const amenityIds = data.amenities?.map((a) => a.globalAmenityId) ?? []
			const validAmenityIds = await prisma.globalVenueAmenity
				.findMany({
					where: { id: { in: amenityIds } },
					select: { id: true },
				})
				.then((amenities) => amenities.map((a) => a.id))
			const invalidAmenityIds = amenityIds.filter(
				(id) => !validAmenityIds.includes(id),
			)
			if (invalidAmenityIds.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid amenity IDs: ${invalidAmenityIds.join(', ')}`,
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

	const { eventTypes, services, spaces, amenities, venueTypeId } =
		submission.value

	await prisma.vendor.update({
		select: { id: true, owner: { select: { username: true } } },
		where: { id: vendorId, ownerId: userId },
		data: {
			venueDetails: {
				upsert: {
					create: {
						venueTypeId: venueTypeId,
						eventTypes: { createMany: { data: eventTypes } },
						services: { createMany: { data: services } },
						spaces: {
							createMany: {
								data: spaces.map((s) => ({
									globalSpaceId: s.globalSpaceId,
									sittingCapacity: s.sittingCapacity || 0,
									standingCapacity: s.standingCapacity || 0,
									parkingCapacity: s.parkingCapacity || 0,
								})),
							},
						},
						amenities: amenities
							? { createMany: { data: amenities } }
							: undefined,
					},
					update: {
						eventTypes: {
							deleteMany: {},
							createMany: { data: eventTypes },
						},
						services: {
							deleteMany: {},
							createMany: { data: services },
						},
						spaces: {
							deleteMany: {},
							createMany: {
								data: spaces.map((s) => ({
									globalSpaceId: s.globalSpaceId,
									sittingCapacity: s.sittingCapacity || 0,
									standingCapacity: s.standingCapacity || 0,
									parkingCapacity: s.parkingCapacity || 0,
								})),
							},
						},
						amenities: amenities
							? {
									deleteMany: {},
									createMany: { data: amenities },
								}
							: undefined,
					},
				},
			},
		},
	})

	return redirect('/vendors/onboarding/final')
}

export function VenueDetailsForm({
	vendor,
	venueOptions,
	actionData,
}: {
	vendor: NonNullable<
		OnboardingDetailsRoute.ComponentProps['loaderData']['vendor']
	>
	venueOptions: VenueOptions
	actionData?: Route.ComponentProps['actionData']
}) {
	const isPending = useIsPending()

	const defaultServices = venueOptions.services.map((service) => {
		const existingService = vendor?.venueDetails?.services?.find(
			(s) => s.globalService.id === service.id,
		)
		return {
			globalServiceId: existingService ? service.id : '',
			price: existingService?.price,
			description: existingService?.description ?? '',
		}
	})

	const [form, fields] = useForm({
		id: 'onboarding-venue-details-form',
		lastResult: actionData?.result,
		defaultValue: {
			vendorId: vendor?.id ?? '',
			vendorType: vendor?.vendorType.id ?? 'venue',
			venueTypeId: vendor?.venueDetails?.venueType?.id ?? '',
			services: defaultServices,
			spaces: [], // Add default values if needed
			eventTypes: [], // Add default values if needed
			amenities: [], // Add default values if needed
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VenueDetailsSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const services = fields.services.getFieldList()

	return (
		<FormProvider context={form.context}>
			<Form
				{...getFormProps(form)}
				method="POST"
				action="/resources/venue-details-form"
			>
				<input type="hidden" name="vendorId" value={vendor?.id} />
				<input type="hidden" name="vendorType" value={vendor?.vendorType.id} />
				<div>
					<h2 className="mb-2 text-2xl font-bold">Venue Type</h2>

					<div className="mb-6">
						<RadioGroup
							name={fields.venueTypeId.name}
							className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
							defaultValue={vendor?.venueDetails?.venueType?.id}
						>
							{venueOptions?.venueTypes.map((venueType) => {
								return (
									<div
										key={venueType.id}
										className="flex items-center space-x-2"
									>
										<RadioGroupItem
											form={form.id}
											value={venueType.id}
											id={venueType.id}
										/>

										<label
											htmlFor={venueType.id}
											className="text-body-xs text-muted-foreground cursor-pointer self-center"
										>
											{venueType.name}
										</label>
									</div>
								)
							})}
						</RadioGroup>
						<ErrorList errors={fields.venueTypeId.errors} />
					</div>
					<h2 className="mb-2 text-2xl font-bold">Services you offer</h2>
					<ul className="mb-6">
						<fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
							{services.map((service, index) => {
								const serviceFields = service.getFieldset()
								const serviceOption = venueOptions.services[index]
								const isChecked = !!serviceFields.globalServiceId.value

								return (
									<li key={service.id} className="space-y-2">
										<CheckboxField
											labelProps={{
												children: serviceOption?.name ?? 'Unnamed Service',
											}}
											buttonProps={{
												name: serviceFields.globalServiceId.name,
												form: form.id,
												value: serviceOption?.id ?? '',
												defaultChecked: isChecked,
											}}
										/>

										{isChecked && (
											<>
												<Input
													placeholder="Price"
													defaultValue={serviceFields.price.value}
													{...getInputProps(serviceFields.price, {
														type: 'number',
													})}
												/>
												<ErrorList errors={serviceFields.price.errors} />
												<Input
													placeholder="Description"
													defaultValue={
														serviceFields.description.value ??
														getServiceDescriptionByServiceName(
															serviceOption?.name ?? '',
														)
													}
													{...getInputProps(serviceFields.description, {
														type: 'text',
													})}
												/>

												<ErrorList errors={serviceFields.description.errors} />
											</>
										)}
									</li>
								)
							})}
						</fieldset>
						<div className="mt-2">
							<ErrorList errors={fields.services.errors} />
						</div>
					</ul>
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
