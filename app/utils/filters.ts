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

const commonFilterInputs: FilterOption[] = [
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

export const photographerFilterInputs: FilterOption[] = [
	...commonFilterInputs,
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

export function getFilterInputs(vendorType: string) {
	switch (vendorType) {
		case 'photography':
			return photographerFilterInputs

		default:
			return commonFilterInputs
	}
}
