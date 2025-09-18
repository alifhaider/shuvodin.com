import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
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
						venueTypeId,
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
									price: s.price,
									description: s.description,
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
	console.log('venueOptions', venueOptions.spaces)
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

	const defaultAmenities = venueOptions.amenities.map((amenity) => {
		const existingAmenity = vendor?.venueDetails?.amenities?.find(
			(a) => a.globalAmenity.id === amenity.id,
		)
		return existingAmenity ? { globalAmenityId: amenity.id } : null
	})

	const defaultEventTypes = venueOptions.eventTypes.map((eventType) => {
		const existingEventType = vendor?.venueDetails?.eventTypes?.find(
			(e) => e.globalEventType.id === eventType.id,
		)

		return existingEventType ? { globalEventTypeId: eventType.id } : null
	})

	const defaultSpaces = venueOptions.spaces.map((space) => {
		const existingSpace = vendor?.venueDetails?.spaces?.find(
			(s) => s.globalSpace.id === space.id,
		)
		return {
			globalSpaceId: existingSpace ? space.id : '',
			sittingCapacity: existingSpace?.sittingCapacity,
			standingCapacity: existingSpace?.standingCapacity,
			parkingCapacity: existingSpace?.parkingCapacity,
			price: existingSpace?.price,
			description: existingSpace?.description ?? '',
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
			spaces: defaultSpaces, // Add default values if needed
			eventTypes: defaultEventTypes, // Add default values if needed
			amenities: defaultAmenities, // Add default values if needed
		},
		onValidate({ formData }) {
			console.log('Validating form data:', Array.from(formData.entries()))
			const result = parseWithZod(formData, { schema: VenueDetailsSchema })
			console.log('Validation result:', result) // Log the validation result
			return result
		},
		onSubmit(event, { submission }) {
			console.log('Form submission:', submission)
			if (submission?.status !== 'success') {
				console.log('Validation errors:', submission?.error)
			}
		},
		shouldRevalidate: 'onBlur',
	})

	console.log('defaultSpaces', defaultSpaces)
	console.log('defaultServices', defaultServices)

	const services = fields.services.getFieldList()
	const spaces = fields.spaces.getFieldList()
	const eventTypes = fields.eventTypes.getFieldList()
	const amenities = fields.amenities.getFieldList()

	console.log('formPops', getFormProps(form))
	return (
		<Form
			{...getFormProps(form)}
			action="/resources/venue-details-form"
			method="POST"
		>
			<input type="hidden" name="vendorId" value={vendor?.id} />
			<input type="hidden" name="vendorType" value={vendor?.vendorType.name} />
			<div>
				<h4 className="mb-2 text-2xl font-bold">Venue Type</h4>

				<div className="mb-6">
					<RadioGroup
						name={fields.venueTypeId.name}
						className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
						defaultValue={vendor?.venueDetails?.venueType?.id}
					>
						{venueOptions?.venueTypes.map((venueType) => {
							return (
								<div key={venueType.id} className="flex items-center space-x-2">
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
				<h4 className="mb-1 text-2xl font-bold">Services you offer</h4>
				<p className="text-muted-foreground text-body-2xs mb-2">
					<strong>Note: </strong>Keep the price field empty if you don't want to
					charge for a service; it will be included in your event-space price.
				</p>
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

				<h4 className="mb-2 text-2xl font-bold">Event Spaces </h4>
				<ul className="mb-6">
					<fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
						{spaces.map((space, index) => {
							const spaceFields = space.getFieldset()
							const spaceOption = venueOptions.spaces[index]
							const isChecked = !!spaceFields.globalSpaceId.value

							return (
								<li key={space.id} className="space-y-2">
									<CheckboxField
										labelProps={{
											children: spaceOption?.name ?? 'Unnamed Space',
										}}
										buttonProps={{
											name: spaceFields.globalSpaceId.name,
											form: form.id,
											value: spaceOption?.id ?? '',
											defaultChecked: isChecked,
										}}
									/>

									{isChecked && (
										<>
											<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
												<div>
													<Input
														placeholder="Price Per Day"
														defaultValue={spaceFields.price.value}
														{...getInputProps(spaceFields.price, {
															type: 'number',
														})}
													/>
													<ErrorList errors={spaceFields.price.errors} />
												</div>
												<div>
													<Input
														placeholder="Sitting Capacity"
														defaultValue={spaceFields.sittingCapacity.value}
														{...getInputProps(spaceFields.sittingCapacity, {
															type: 'number',
														})}
													/>
													<ErrorList
														errors={spaceFields.sittingCapacity.errors}
													/>
												</div>
												<div>
													<Input
														placeholder="Standing Capacity"
														defaultValue={spaceFields.standingCapacity.value}
														{...getInputProps(spaceFields.standingCapacity, {
															type: 'number',
														})}
													/>
													<ErrorList
														errors={spaceFields.standingCapacity.errors}
													/>
												</div>
												<div>
													<Input
														placeholder="Parking Capacity"
														defaultValue={spaceFields.parkingCapacity.value}
														{...getInputProps(spaceFields.parkingCapacity, {
															type: 'number',
														})}
													/>
													<ErrorList
														errors={spaceFields.parkingCapacity.errors}
													/>
												</div>
											</div>
											<Input
												placeholder="Description"
												defaultValue={
													spaceFields.description.value ??
													getServiceDescriptionByServiceName(
														spaceOption?.name ?? '',
													)
												}
												{...getInputProps(spaceFields.description, {
													type: 'text',
												})}
											/>

											<ErrorList errors={spaceFields.description.errors} />
										</>
									)}
								</li>
							)
						})}
					</fieldset>
					<div className="mt-2">
						<ErrorList errors={fields.spaces.errors} />
					</div>
				</ul>

				<h4 className="mb-2 text-2xl font-bold">Amenities</h4>
				<ul className="mb-6">
					<fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
						{amenities.map((amenity, index) => {
							const amenityFields = amenity.getFieldset()
							const amenityOption = venueOptions.amenities[index]
							const isChecked = !!amenityFields.globalAmenityId.value

							return (
								<li key={amenity.id} className="space-y-2">
									<CheckboxField
										labelProps={{
											children: amenityOption?.name ?? 'Unnamed Amenity',
										}}
										buttonProps={{
											name: amenityFields.globalAmenityId.name,
											form: form.id,
											value: amenityOption?.id ?? '',
											defaultChecked: isChecked,
										}}
									/>
								</li>
							)
						})}
					</fieldset>
					<div className="mt-2">
						<ErrorList errors={fields.amenities.errors} />
					</div>
				</ul>
				<h4 className="mb-2 text-2xl font-bold">Event Types</h4>
				<ul className="mb-6">
					<fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
						{eventTypes.map((eventType, index) => {
							const eventTypeFields = eventType.getFieldset()
							const eventTypeOption = venueOptions.eventTypes[index]
							const isChecked = !!eventTypeFields.globalEventTypeId.value

							return (
								<li key={eventType.id} className="space-y-2">
									<CheckboxField
										labelProps={{
											children: eventTypeOption?.name ?? 'Unnamed Event Type',
										}}
										buttonProps={{
											name: eventTypeFields.globalEventTypeId.name,
											form: form.id,
											value: eventTypeOption?.id ?? '',
											defaultChecked: isChecked,
										}}
									/>
								</li>
							)
						})}
					</fieldset>
					<div className="mt-2">
						<ErrorList errors={fields.eventTypes.errors} />
					</div>
				</ul>
			</div>

			<ErrorList errors={form.errors} />

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
	)
}
