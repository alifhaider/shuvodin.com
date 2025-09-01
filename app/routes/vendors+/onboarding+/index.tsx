import { requireUserId } from '#app/utils/auth.server.ts'
import { cn, VendorType } from '#app/utils/misc.tsx'
import { z } from 'zod'
import { Route } from '../+types/onboarding'
import { checkHoneypot } from '#app/utils/honeypot.server.ts'
import { parseWithZod } from '@conform-to/zod'
import { data, Link, Outlet, redirect, useMatches } from 'react-router'
import {
	venueAmenityNames,
	venueEventSpaceNames,
	venueEventTypeNames,
	venueServiceNames,
} from '../__vendor-types'
import { OnboardingWizard } from '#app/components/onboarding-wizard.tsx'
import { useState } from 'react'
import { Icon } from '#app/components/ui/icon.tsx'
import Breadcrumb from '#app/components/breadcrumb.tsx'
import { SEOHandle } from '@nasa-gcn/remix-seo'

export const meta: Route.MetaFunction = () => {
	return [{ title: 'Vendor Onboarding / ShuvoDin' }]
}

export const onboardingVendorSessionKey = 'onboardingVendor'
export const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

const VendorSlugSchema = z
	.string()
	.min(3)
	.max(30)
	.regex(/^[a-zA-Z0-9-_]+$/)
	.toLowerCase()

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

export const ServicesSchema = z.object({
	amenities: z.array(z.enum(venueAmenityNames)).optional(),
	services: z.array(z.enum(venueServiceNames)).optional(),
	eventTypes: z.array(z.enum(venueEventTypeNames)).optional(),
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

export const GallerySchema = z.object({
	gallery: z.array(ImageFieldsetSchema).max(5),
})

export const LinksSchema = z.object({
	phone: z.string().min(11).optional(),
	website: z.string().url().optional(),
	socialLink: z.string().url().optional(),
	mapUrl: z.string().url().optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
})

export const OnboardingVendorSignUpSchema = GeneralInfoSchema.merge(LinksSchema)
	.merge(GallerySchema)
	.merge(ServicesSchema)
	.merge(z.object({ venueDetails: VenueDetailsSchema.optional() }))

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: OnboardingVendorSignUpSchema,
	})

	if (submission.status !== 'success') {
		return submission.reply()
	}

	// Save to database here
	const vendorData = submission.value

	// Redirect to success page
	return redirect('/onboarding/success')
}

export default function OnboardingVendor() {
	return (
		<div className="space-y-6">
			<Outlet />
		</div>
	)
}
