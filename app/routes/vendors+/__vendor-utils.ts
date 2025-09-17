import { z } from 'zod'

export const venueEventSpaceNames = [
	'Indoor',
	'Outdoor',
	'Rooftop',
	'Garden',
	'Ballroom',
	'Conference Room',
	'Banquet Hall',
	'Terrace',
	'Lounge',
] as const

export const venueEventTypeNames = [
	'Wedding',
	'Corporate Event',
	'Birthday Party',
	'Concert',
	'Festival',
	'Exhibition',
	'Workshop',
	'Seminar',
] as const

export const venueServiceNames = [
	{
		name: 'Catering Veg',
		description: 'Rice, Bread, Salad, Drinks, Dessert, etc.',
	},
	{
		name: 'Catering Non-Veg',
		description:
			'Chicken, Beef, Fish, Rice, Bread, Salad, Drinks, Dessert, etc.',
	},
	{
		name: 'Decoration Basic',
		description:
			'Basic decoration with flowers and lights. Includes a stage setup. 1 sofa set.',
	},
	{
		name: 'Decoration Premium',
		description:
			'Premium decoration with flowers, lights, and drapes. Includes a stage setup. 2 sofa sets. Photo booth.',
	},
	{
		name: 'Music/DJ',
		description: 'Professional DJ services with sound system and lighting.',
	},
	{
		name: 'Event Planning',
		description:
			'Full event planning services including coordination on the event day.',
	},
] as const

export function getServiceDescriptionByServiceName(name: string) {
	return venueServiceNames.find(
		(service) => service.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
	)?.description
}

export const venueAmenityNames = [
	'WiFi',
	'Parking',
	'Restrooms',
	'Air Conditioning',
	'Heating',
	'Stage',
	'Sound System',
	'Projector',
	'Dance Floor',
	'Outdoor Area',
	'Kitchen',
	'Accessibility Features',
] as const

export const BaseDetailsSchema = z.object({ vendorId: z.string() })

const VenueServiceSchema = z.object({
	globalServiceId: z
		.string({ required_error: 'Please select a service.' })
		.min(1, 'Service ID is required.'),
	price: z
		.number({ invalid_type_error: 'Price must be a number.' })
		.min(0, 'Price cannot be negative.')
		.optional()
		.nullable(),
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters.')
		.optional()
		.nullable(),
})

const VenueSpaceSchema = z.object({
	globalSpaceId: z
		.string({ required_error: 'Please select a space.' })
		.min(1, 'Space ID is required.'),
	price: z
		.number({ invalid_type_error: 'Price must be a number.' })
		.min(0, 'Price cannot be negative.')
		.optional()
		.nullable(),
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters.')
		.optional()
		.nullable(),
	sittingCapacity: z
		.number({ invalid_type_error: 'Sitting capacity must be a number.' })
		.min(0, 'Sitting capacity cannot be negative.')
		.optional()
		.nullable(),
	standingCapacity: z
		.number({ invalid_type_error: 'Standing capacity must be a number.' })
		.min(0, 'Standing capacity cannot be negative.')
		.optional()
		.nullable(),
	parkingCapacity: z
		.number({ invalid_type_error: 'Parking capacity must be a number.' })
		.min(0, 'Parking capacity cannot be negative.')
		.optional()
		.nullable(),
})

const VenueAmenitySchema = z.object({
	globalAmenityId: z
		.string({ required_error: 'Please select an amenity.' })
		.min(1, 'Amenity ID is required.'),
})

const VenueEventTypeSchema = z.object({
	globalEventTypeId: z
		.string({ required_error: 'Please select an event type.' })
		.min(1, 'Event Type ID is required.'),
})

const VenueTypeSchema = z.object({
	id: z.string({ required_error: 'Please select a venue type.' }),
})

// amenities will be amenity ids
export const VenueDetailsSchema = BaseDetailsSchema.extend({
	vendorType: z.literal('venue'),
	services: z
		.array(VenueServiceSchema)
		.min(1, 'Select at least one service')
		.refine(
			(services) => {
				const ids = services.map((s) => s.globalServiceId)
				return ids.length === new Set(ids).size
			},
			{ message: 'Duplicate services are not allowed.' },
		),
	spaces: z
		.array(VenueSpaceSchema)
		.min(1, 'Select at least one event space')
		.refine(
			(spaces) => {
				const ids = spaces.map((s) => s.globalSpaceId)
				return ids.length === new Set(ids).size
			},
			{ message: 'Duplicate event spaces are not allowed.' },
		),
	eventTypes: z
		.array(VenueEventTypeSchema)
		.min(1, 'Select at least one event type')
		.refine(
			(eventTypes) => {
				const ids = eventTypes.map((e) => e.globalEventTypeId)
				return ids.length === new Set(ids).size
			},
			{ message: 'Duplicate event types are not allowed.' },
		),
	amenities: z
		.array(VenueAmenitySchema)
		.optional()
		.refine(
			(amenities) => {
				if (!amenities) return true
				const ids = amenities.map((a) => a.globalAmenityId)
				return ids.length === new Set(ids).size
			},
			{ message: 'Duplicate amenities are not allowed.' },
		),

	venueTypeId: z.string({ required_error: 'Please select a venue type.' }),
})

export const MakeupArtistDetailsSchema = BaseDetailsSchema.extend({
	vendorType: z.literal('makeup-artist'),
	details: z.object({
		brands: z.array(z.string()).optional(),
		services: z.array(z.string()).min(1, 'Select at least one service'),
		dietaryOptions: z.array(z.string()).optional(),
	}),
})
export const VendorDetailsSchema = z.discriminatedUnion('vendorType', [
	VenueDetailsSchema,
	MakeupArtistDetailsSchema,
	// Add other vendor types here, e.g., CatererDetailsSchema
])

export type VendorDetails = z.infer<typeof VendorDetailsSchema>
export type VenueDetails = z.infer<typeof VenueDetailsSchema>
// export type CatererDetails = z.infer<typeof CatererDetailsSchema>
// export type CatererDetails = z.infer<typeof CatererDetailsSchema>

// Type guard helpers
export function isVenueDetails(
	details: VendorDetails,
): details is Extract<VendorDetails, { vendorType: 'venue' }> {
	return details.vendorType === 'venue'
}

export function isMakeupArtistDetails(
	details: VendorDetails,
): details is Extract<VendorDetails, { vendorType: 'makeup-artist' }> {
	return details.vendorType === 'makeup-artist'
}

// export function isCatererDetails(details: VendorDetails): details is CatererDetails {
// 	return details.vendorType === 'caterer'
// }
