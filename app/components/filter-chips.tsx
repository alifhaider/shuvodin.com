import { useSearchParams } from 'react-router'
import { Icon } from './ui/icon'

export function FilterChips() {
	const [searchParams, setSearchParams] = useSearchParams()

	// Get all active filters
	const activeFilters = getActiveFilters(searchParams)

	const handleRemoveFilter = (filter: ActiveFilter) => {
		const newParams = new URLSearchParams(searchParams)

		if (filter.type === 'venue-type') {
			// Remove specific venue type
			const venueTypes = newParams.getAll('venue-type')
			newParams.delete('venue-type')
			venueTypes.forEach((vt) => {
				if (vt !== filter.value) newParams.append('venue-type', vt)
			})
		} else if (filter.type === 'price-range') {
			// Remove price range
			newParams.delete('minPrice')
			newParams.delete('maxPrice')
		} else if (filter.type === 'capacity-range') {
			// Remove capacity range
			newParams.delete('minCapacity')
			newParams.delete('maxCapacity')
		}

		setSearchParams(newParams)
	}

	if (activeFilters.length === 0) return null

	return (
		<div className="mb-4 flex flex-wrap gap-2">
			{activeFilters.map((filter) => (
				<button
					key={`${filter.type}-${filter.value}`}
					onClick={() => handleRemoveFilter(filter)}
					className="border-secondary group hover:border-primary/80 mt-4 flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold transition-all"
				>
					{filter.label}
					<Icon
						name="cross-2"
						className="group-hover:text-primary/80 h-3 w-3 stroke-3"
					/>
				</button>
			))}
		</div>
	)
}

type ActiveFilter = {
	type: 'venue-type' | 'price-range' | 'capacity-range'
	value: string
	label: string
}

function getActiveFilters(searchParams: URLSearchParams): ActiveFilter[] {
	const filters: ActiveFilter[] = []

	// Venue types
	const venueTypes = searchParams.getAll('venue-type')
	venueTypes.forEach((vt) => {
		filters.push({
			type: 'venue-type',
			value: vt,
			label: formatVenueTypeLabel(vt),
		})
	})

	// Price range
	const minPrice = searchParams.get('minPrice')
	const maxPrice = searchParams.get('maxPrice')
	if (minPrice && maxPrice) {
		filters.push({
			type: 'price-range',
			value: `${minPrice}-${maxPrice}`,
			label: `${minPrice}-${maxPrice}`,
		})
	}

	// Capacity range
	const minCapacity = searchParams.get('minCapacity')
	const maxCapacity = searchParams.get('maxCapacity')
	if (minCapacity === '0' && maxCapacity === '50') {
		filters.push({
			type: 'capacity-range',
			value: `${minCapacity}-${maxCapacity}`,
			label: 'Up to 50',
		})
	} else if (minCapacity && maxCapacity) {
		filters.push({
			type: 'capacity-range',
			value: `${minCapacity}-${maxCapacity}`,
			label: `${minCapacity}-${maxCapacity}`,
		})
	}

	return filters
}

function formatVenueTypeLabel(value: string): string {
	return value
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
