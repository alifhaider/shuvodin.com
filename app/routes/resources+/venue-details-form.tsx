import { FormProvider, getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { useEffect } from 'react'
import { data, Form, redirect } from 'react-router'
import { z } from 'zod'
import { CheckboxField, ErrorList } from '#app/components/forms.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireVendor } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { VenueDetailsSchema } from '../vendors+/__vendor-types'
import { type Route as OnboardingDetailsRoute } from '../vendors+/onboarding+/+types/details'
import { type VenueOptions } from '../vendors+/onboarding+/details'
import { type Route } from './+types/venue-details-form'

export async function action({ request }: Route.ActionArgs) {
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
				where: { id: data.venueType.globalVenueTypeId },
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

	const { eventTypes, services, spaces, amenities, venueType } =
		submission.value

	await prisma.vendor.update({
		select: { id: true, owner: { select: { username: true } } },
		where: { id: vendorId, ownerId: userId },
		data: {
			venueDetails: {
				upsert: {
					create: {
						venueTypeId: venueType.globalVenueTypeId,
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

	return redirect('/vendors/onboarding/details')
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

	useEffect(() => {}, [])

	const [form, fields] = useForm({
		id: 'services-form',
		lastResult: actionData?.result,
		onValidate({ formData }) {
			console.log('Validating form data:', Array.from(formData.entries()))
			return parseWithZod(formData, { schema: VenueDetailsSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<FormProvider context={form.context}>
			<Form
				method="post"
				{...getFormProps(form)}
				action="/resources/venue-details-form"
			>
				<input type="hidden" name="vendorId" value={vendor?.id} />
				<input type="hidden" name="vendorType" value={vendor?.vendorType.id} />
				<div className="space-y-8">
					<h2 className="text-2xl font-bold">Select Venue Type</h2>

					<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
						{venueOptions?.venueTypes.map((venueType) => {
							const isChecked =
								vendor?.venueDetails?.venueType?.id === venueType.id
							return (
								<CheckboxField
									key={venueType.id}
									labelProps={{ children: venueType.name }}
									buttonProps={{
										name: venueType.name,
										form: form.id,
										value: venueType.id,
										defaultChecked: isChecked,
									}}
									errors={fields.venueType.errors}
									className="mb-2"
								/>
							)
						})}
					</div>
					<ErrorList errors={fields.venueType.errors} />
					<h2 className="text-2xl font-bold">Select the services you offer</h2>

					<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
						{venueOptions?.services.map((service) => {
							const isChecked = !!vendor?.venueDetails?.services?.some(
								(s) => s.globalService.id === service.id,
							)
							return (
								<div key={service.id} className="space-y-2">
									<CheckboxField
										labelProps={{ children: service.name }}
										buttonProps={{
											name: service.name,
											form: form.id,
											value: service.id,
											defaultChecked: isChecked,
										}}
										errors={fields.services.errors}
										className="mb-2"
									/>

									<Input
										form={form.id}
										name={`${service.name}-input`}
										placeholder="Price"
										type="number"
										defaultValue={
											isChecked
												? (vendor?.venueDetails?.services?.find(
														(s) => s.globalService.id === service.id,
													)?.price ?? '')
												: ''
										}
									/>

									<Input
										form={form.id}
										name={`${service.name}-description`}
										placeholder="Description"
										type="text"
										defaultValue={
											isChecked
												? (vendor?.venueDetails?.services?.find(
														(s) => s.globalService.id === service.id,
													)?.description ?? '')
												: ''
										}
									/>
								</div>
							)
						})}
					</div>
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
1
