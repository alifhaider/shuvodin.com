import { Outlet, redirect } from 'react-router'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { VendorType } from '#app/utils/misc.tsx'
import { type Route } from '../+types/index'
import { venueEventSpaceNames } from '../__vendor-utils'

export const meta: Route.MetaFunction = () => {
	return [{ title: 'Vendor Onboarding / ShuvoDin' }]
}

export const onboardingVendorSessionKey = 'onboardingVendor'

const VendorSlugSchema = z
	.string()
	.min(3)
	.max(30)
	.regex(/^[a-zA-Z0-9-_]+$/)
	.toLowerCase()

export const GeneralInfoSchema = z.object({
	businessName: z.string().min(3, 'Business name is required'),
	slug: VendorSlugSchema,
	vendorType: z.enum(Object.values(VendorType) as [string, ...string[]]),
	division: z.string().min(2, 'Division is required'),
	district: z.string().min(2, 'District is required'),
	thana: z.string().min(2, 'Thana is required'),
	address: z.string().optional(),
	description: z.string().min(10).max(500),
})

export const VenueDetailsSchema = z.object({
	venueTypeId: z.string(),
	spaces: z
		.array(
			z.object({
				name: z.enum(venueEventSpaceNames),
				description: z.string().optional(),
				sittingCapacity: z.number().min(0),
				standingCapacity: z.number().min(0),
				parkingCapacity: z.number().min(0).optional(),
				price: z.number().min(0).optional(),
				includeInTotalPrice: z.boolean().default(false),
			}),
		)
		.min(1),
})

export const LinksSchema = z.object({
	phone: z.string().min(11).optional(),
	website: z.string().url().optional(),
	socialLink: z.string().url().optional(),
	mapUrl: z.string().url().optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
})

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	return redirect('/vendors/onboarding/general')
}

export default function OnboardingVendor() {
	return (
		<div className="space-y-6">
			<Outlet />
		</div>
	)
}
