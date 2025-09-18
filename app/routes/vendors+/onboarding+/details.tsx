import {
	type GlobalVenueAmenity,
	type GlobalVenueEventType,
	type GlobalVenueService,
	type GlobalVenueSpace,
} from '@prisma/client'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { VenueDetailsForm } from '#app/routes/resources+/venue-details-form.tsx'
import { requireVendor } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/details'

export type VenueOptions = {
	services: Pick<GlobalVenueService, 'id' | 'name'>[]
	amenities: Pick<GlobalVenueAmenity, 'id' | 'name'>[]
	eventTypes: Pick<GlobalVenueEventType, 'id' | 'name'>[]
	spaces: Pick<GlobalVenueSpace, 'id' | 'name'>[]
	venueTypes: { id: string; name: string }[]
}

export type PhotographyOptions = {
	services: { id: string; name: string }[]
}

export async function loader({ request }: Route.LoaderArgs) {
	const { userId, vendorId } = await requireVendor(request)
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId, ownerId: userId },
		select: {
			id: true,
			slug: true,
			vendorType: { select: { name: true, id: true } },
			venueDetails: {
				select: {
					amenities: {
						select: { globalAmenity: { select: { id: true, name: true } } },
					},
					services: {
						select: {
							globalService: { select: { id: true, name: true } },
							price: true,
							description: true,
						},
					},
					eventTypes: {
						select: { globalEventType: { select: { id: true, name: true } } },
					},
					spaces: {
						select: { globalSpace: { select: { id: true, name: true } } },
					},
					venueType: { select: { id: true, name: true } },
				},
			},
			photographerDetails: {
				select: { services: { select: { id: true, name: true } } },
			},
		},
	})

	if (!vendor) {
		throw new Response('Vendor not found', { status: 404 })
	}

	let availableOptions: VenueOptions | PhotographyOptions
	switch (vendor.vendorType.name) {
		case 'venue':
			availableOptions = await getVenueOptions()
			break
		case 'Photographer':
			availableOptions = await getPhotographyOptions()
			break
		default:
			availableOptions = await getVenueOptions()
	}

	return {
		vendor,
		availableOptions,
	}
}

async function getVenueOptions() {
	const [services, amenities, eventTypes, spaces, venueTypes] =
		await Promise.all([
			prisma.globalVenueService.findMany({ select: { id: true, name: true } }),
			prisma.globalVenueAmenity.findMany({ select: { id: true, name: true } }),
			prisma.globalVenueEventType.findMany({
				select: { id: true, name: true },
			}),
			prisma.globalVenueSpace.findMany({ select: { id: true, name: true } }),
			prisma.venueType.findMany({ select: { id: true, name: true } }),
		])

	return { services, amenities, eventTypes, spaces, venueTypes } as const
}

async function getPhotographyOptions() {
	const services = await prisma.photographyService.findMany({
		select: { id: true, name: true },
	})
	return { services } as const
}

export default function OnboardingServices({
	loaderData,
}: Route.ComponentProps) {
	if (loaderData.vendor.vendorType.name === 'venue') {
		return (
			<VenueDetailsForm
				vendor={loaderData.vendor}
				venueOptions={loaderData.availableOptions as VenueOptions}
			/>
		)
	}
	return (
		<VenueDetailsForm
			vendor={loaderData.vendor}
			venueOptions={loaderData.availableOptions as VenueOptions}
		/>
	)
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
