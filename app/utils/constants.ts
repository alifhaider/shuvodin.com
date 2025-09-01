export enum VendorType {
	PHOTOGRAPHER = 'Photographer',
	VENUE = 'Venue',
	CATERING = 'Catering',
	DECORATION = 'Decoration',
	EVENT_PLANNING = 'Event Planning',
	ENTERTAINMENT = 'Entertainment',
	TRANSPORTATION = 'Transportation',
	FLORISTRY = 'Floristry',
	WEDDING_CAKES = 'Wedding Cakes',
	BRIDAL_WEAR = 'Bridal Wear',
}

export const vendorTypes = [
	{
		icon: 'camera',
		title: VendorType.PHOTOGRAPHER,
		color: 'bg-blue-50 text-blue-600',
		slug: 'photographer',
	},
	{
		icon: 'building-2',
		title: VendorType.VENUE,
		color: 'bg-purple-50 text-purple-600',
		slug: 'venue',
	},
	{
		icon: 'utensils',
		title: VendorType.CATERING,
		color: 'bg-green-50 text-green-600',
		slug: 'catering',
	},
	{
		icon: 'palette',
		title: VendorType.DECORATION,
		color: 'bg-pink-50 text-pink-600',
		slug: 'decoration',
	},
	{
		icon: 'users',
		title: VendorType.EVENT_PLANNING,
		color: 'bg-orange-50 text-orange-600',
		slug: 'event-planning',
	},
	{
		icon: 'music',
		title: VendorType.ENTERTAINMENT,
		color: 'bg-indigo-50 text-indigo-600',
		slug: 'entertainment',
	},
	{
		icon: 'car',
		title: VendorType.TRANSPORTATION,
		color: 'bg-red-50 text-red-600',
		slug: 'transportation',
	},
	{
		icon: 'flower-2',
		title: VendorType.FLORISTRY,
		color: 'bg-emerald-50 text-emerald-600',
		slug: 'flowers',
	},
	{
		icon: 'cake',
		title: VendorType.WEDDING_CAKES,
		color: 'bg-yellow-50 text-yellow-600',
		slug: 'cakes',
	},
	{
		icon: 'shirt',
		title: VendorType.BRIDAL_WEAR,
		color: 'bg-teal-50 text-teal-600',
		slug: 'wearings',
	},
]
