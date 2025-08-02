type FilterOption = {
	title: string
	value: string
	inputs: {
		name: string
		type: string
		placeholder?: string
		label?: string
		description?: string
	}[]
}

const priceFilterInputs: FilterOption[] = [
	{
		title: 'Price',
		value: 'price',
		inputs: [
			{
				name: 'minPrice',
				type: 'number',
				placeholder: 'Enter minimum price',
				label: 'Minimum price',
			},
			{
				name: 'maxPrice',
				type: 'number',
				placeholder: 'Enter maximum price',
				label: 'Maximum price',
			},
		],
	},
]

const awardFilterInputs: FilterOption[] = [
	{
		title: 'Award winners',
		value: 'award-winners',
		inputs: [
			{
				name: 'allBestOfShuvodinWinners',
				type: 'checkbox',
				label: 'All Best of ShuvoDin Winners',
			},
			{
				name: 'bestOfShuvodin2025Winners',
				type: 'checkbox',
				label: 'Best of ShuvoDin 2025 Winners',
			},
		],
	},
]

export const photographerFilterInputs: FilterOption[] = [
	...priceFilterInputs,
	{
		title: 'Location and Fees',
		value: 'location-fees',
		inputs: [
			{
				name: 'basedInCity',
				type: 'checkbox',
				label: 'Based in City',
				description:
					'Based in the wedding location itself, these photographers might know all the best local spots.',
			},
			{
				name: 'servesThisCity',
				type: 'checkbox',
				label: 'Serves this city',
				description: 'Not local but serves your location at no extra cost.',
			},
			{
				name: 'servesThisCityForAdditionalFees',
				type: 'checkbox',
				label: 'Serves this city for additional fees',
				description:
					'Not local but serves your location with additional travel fees.',
			},
		],
	},
	{
		title: 'Photography Style',
		value: 'style',
		inputs: [
			{
				name: 'classic',
				type: 'checkbox',
				label: 'Classic',
			},
			{ name: 'editorial', type: 'checkbox', label: 'Editorial' },
			{ name: 'fineArt', type: 'checkbox', label: 'Fine Art' },
			{
				name: 'photojournalistic',
				type: 'checkbox',
				label: 'Photojournalistic',
			},
		],
	},

	{
		title: 'Services',
		value: 'services',
		inputs: [
			{
				name: 'brideOnlySession',
				type: 'checkbox',
				label: 'Bride-only session',
			},
			{
				name: 'dronePhotography',
				type: 'checkbox',
				label: 'Drone photography',
			},
			{
				name: 'engagementSession',
				type: 'checkbox',
				label: 'Engagement session',
			},
			{
				name: 'extraHours',
				type: 'checkbox',
				label: 'Extra hours',
			},
			{
				name: 'imageEditing',
				type: 'checkbox',
				label: 'Image editing',
			},
			{
				name: 'onlineProofing',
				type: 'checkbox',
				label: 'Online proofing',
			},
			{
				name: 'printingRights',
				type: 'checkbox',
				label: 'Printing rights',
			},
			{
				name: 'sameDayEdits',
				type: 'checkbox',
				label: 'Same-day edits',
			},
			{
				name: 'secondPhotographer',
				type: 'checkbox',
				label: 'Second photographer',
			},
		],
	},
	{
		title: 'Award winners',
		value: 'award-winners',
		inputs: [
			{
				name: 'allBestOfShuvodinWinners',
				type: 'checkbox',
				label: 'All Best of ShuvoDin Winners',
			},
			{
				name: 'bestOfShuvodin2025Winners',
				type: 'checkbox',
				label: 'Best of ShuvoDin 2025 Winners',
			},
		],
	},
	{
		title: 'Photo format',
		value: 'photo-format',
		inputs: [
			{
				name: 'digitalOnly',
				type: 'checkbox',
				label: 'Digital only',
				description:
					'Photographers who only provide digital files in a memory card or online gallery.',
			},
			{
				name: 'film',
				type: 'checkbox',
				label: 'Film',
				description:
					'Photographers who shoot on film and provide developed prints.',
			},
			{
				name: 'hybrid',
				type: 'checkbox',
				label: 'Hybrid',
				description:
					'Photographers who shoot both digital and film, providing a mix of both formats.',
			},
		],
	},
	{
		title: "What you'll get",
		value: 'what-you-get',
		inputs: [
			{
				name: 'digitalFiles',
				type: 'checkbox',
				label: 'Digital files',
			},
			{
				name: 'digitalRights',
				type: 'checkbox',
				label: 'Digital rights',
			},
			{
				name: 'onlineGallery',
				type: 'checkbox',
				label: 'Online gallery',
			},
			{
				name: 'photoBox',
				type: 'checkbox',
				label: 'Photo box',
			},
			{
				name: 'printedEnlargements',
				type: 'checkbox',
				label: 'Printed enlargements',
			},
			{
				name: 'sneakPeekImages',
				type: 'checkbox',
				label: 'Same/next-day sneak-peek images',
			},
			{
				name: 'slideshow',
				type: 'checkbox',
				label: 'Slideshow',
			},
			{
				name: 'video',
				type: 'checkbox',
				label: 'Video',
			},
			{
				name: 'weddingAlbum',
				type: 'checkbox',
				label: 'Wedding album',
			},
		],
	},
]

export const venueFilterInputs: FilterOption[] = [
	...priceFilterInputs,
	// {
	// 	title: 'Availability',
	// 	value: 'availability',
	// 	inputs: [
	// 		{
	// 			name: 'calendar',
	// 			type: 'calendar',
	// 		},
	// 	],
	// },
	{
		title: 'Capacity',
		value: 'capacity',
		inputs: [
			{
				name: '100-150',
				type: 'checkbox',
				label: '100-150',
			},
			{
				name: '150-200',
				type: 'checkbox',
				label: '150-200',
			},
			{
				name: '200-250',
				type: 'checkbox',
				label: '200-250',
			},
			{
				name: '250-300',
				type: 'checkbox',
				label: '250-300',
			},
			{ name: '300+', type: 'checkbox', label: '300+' },
			{
				name: '50-100',
				type: 'checkbox',
				label: '50-100',
			},
			{
				name: 'upTo50',
				type: 'checkbox',
				label: 'Up to 50',
			},
		],
	},
	{
		title: 'Indoor/Outdoor',
		value: 'indoor-outdoor',
		inputs: [
			{
				name: 'indoor',
				type: 'checkbox',
				label: 'Indoor',
			},
			{
				name: 'outdoor',
				type: 'checkbox',
				label: 'Outdoor',
				description:
					'Not Covered,but can often accommodate temporary options like tents and canopies.',
			},
			{
				name: 'outdoorCovered',
				type: 'checkbox',
				label: 'Covered outdoor',
			},
		],
	},
	{
		title: 'Venue Type',
		value: 'venue-type',
		inputs: [
			{
				name: 'convention Halls',
				type: 'checkbox',
				label: 'Convention Halls',
			},
			{
				name: 'community-centers',
				type: 'checkbox',
				label: 'Community Centers',
			},
			{
				name: 'hotel-ballrooms',
				type: 'checkbox',
				label: 'Hotel Ballrooms',
			},
			{
				name: 'Resorts',
				type: 'checkbox',
				label: 'Resorts',
			},
			{
				name: 'rooftop',
				type: 'checkbox',
				label: 'Rooftop',
			},
			{ name: 'garden-lawn', type: 'checkbox', label: 'Garden/Lawn Venue' },
		],
	},
	{
		title: 'Included',
		value: 'included',
		inputs: [
			{
				name: 'allInclusive',
				type: 'checkbox',
				label: 'All-inclusive',
				description:
					'The venue takes care of it all - food and beverage, rentals, the works!',
			},
			{
				name: 'rawSpace',
				type: 'checkbox',
				label: 'Raw space',
				description:
					"The venue will provide just the space. You'll bring in your own caterer and vendors.",
			},
			{
				name: 'selectServices',
				type: 'checkbox',
				label: 'Select services',
				description:
					'The venue will provide the space, plus a few extras. Check the venue for specifics.',
			},
		],
	},
	...awardFilterInputs,
	{
		title: 'Amenities',
		value: 'amenities',
		inputs: [
			{
				name: 'cateringServices',
				type: 'checkbox',
				label: 'Catering services',
			},
			{
				name: 'serviceStaff',
				type: 'checkbox',
				label: 'Service staff',
				description: 'Waiters, servers, and cleanup crew',
			},
			{
				name: 'eventCoordinator',
				type: 'checkbox',
				label: 'Event coordinator',
				description:
					'Helps with timeline, vendor coordination, and troubleshooting',
			},
			{
				name: 'bridalSuite',
				type: 'checkbox',
				label: 'Bridal suite',
			},
			{
				name: 'danceFloor',
				type: 'checkbox',
				label: 'Dance floor',
			},
			{
				name: 'lighting',
				type: 'checkbox',
				label: 'Lighting and sound system',
			},
			{
				name: 'eventRentals',
				type: 'checkbox',
				label: 'Event rentals',
				description: 'Chairs, tables, décor, stage setup etc.',
			},
			{
				name: 'parking',
				type: 'checkbox',
				label: 'Parking',
				description: 'On-site or nearby parking for guests',
			},
			{
				name: 'wifi',
				type: 'checkbox',
				label: 'Wi-Fi',
			},
		],
	},
	{
		title: 'Event Types',
		value: 'event-types',
		inputs: [
			{
				name: 'weddingCeremony',
				type: 'checkbox',
				label: 'Wedding ceremony',
			},
			{
				name: 'reception',
				type: 'checkbox',
				label: 'Reception',
			},
			{
				name: 'rehearsalDinner',
				type: 'checkbox',
				label: 'Rehearsal dinner',
			},
			{
				name: 'weddingShower',
				type: 'checkbox',
				label: 'Wedding shower',
			},
			{
				name: 'engagementParty',
				type: 'checkbox',
				label: 'Engagement party',
			},
			{
				name: 'birthdayParty',
				type: 'checkbox',
				label: 'Birthday party',
			},
			{
				name: 'other',
				type: 'checkbox',
				label: 'Other',
				description: 'Check with the venue for specific event types',
			},
		],
	},
]

export function getFilterInputs(vendorType: string) {
	console.log('Vendor Type:', vendorType)
	switch (vendorType.toLocaleLowerCase()) {
		case 'photography':
			return photographerFilterInputs
		case 'venues':
			return venueFilterInputs

		default:
			return priceFilterInputs
	}
}
