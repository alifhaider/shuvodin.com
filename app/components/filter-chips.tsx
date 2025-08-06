import { useSearchParams } from 'react-router'
import { Icon } from './ui/icon'

export function FilterChips({
	capacityRanges,
}: {
	capacityRanges: Record<string, boolean>
}) {
	const [searchParams, setSearchParams] = useSearchParams()

	// Get all active filters
	const activeFilters = getActiveFilters(searchParams, capacityRanges)
	console.log('activeFilters', activeFilters)

	const handleRemoveFilter = (filter: ActiveFilter) => {
		const newParams = new URLSearchParams(searchParams)

		if (filter.type === 'price-range') {
			// Remove price range
			newParams.delete('minPrice')
			newParams.delete('maxPrice')
		}

		const filterkeys = Object.keys(searchParams)
		console.log('filterkeys', filterkeys)

		// if (filter.type === 'venue-type') {
		// 	// Remove specific venue type
		// 	const venueTypes = newParams.getAll('venue-type')
		// 	newParams.delete('venue-type')
		// 	venueTypes.forEach((vt) => {
		// 		if (vt !== filter.value) newParams.append('venue-type', vt)
		// 	})
		// } else else if (filter.type === 'capacity-range') {
		// 	// Remove capacity range
		// 	newParams.delete('minCapacity')
		// 	newParams.delete('maxCapacity')
		// }

		setSearchParams(newParams)
	}

	if (activeFilters.length === 0) return null

	return (
		<div className="flex flex-wrap gap-2">
			{activeFilters.map((filter) => (
				<button
					key={`${filter.type}-${filter.value}`}
					onClick={() => handleRemoveFilter(filter)}
					className="border-secondary group hover:border-primary/80 flex items-center gap-2 rounded-xl border px-3 py-1 text-sm font-semibold transition-all"
				>
					{filter.label}
					<Icon
						name="cross-2"
						className="group-hover:text-primary/80 h-3 w-3 stroke-3"
					/>
				</button>
			))}
			{activeFilters.length > 0 && (
				<button
					onClick={() => setSearchParams(new URLSearchParams())}
					className="border-destructive group hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2 rounded-xl border px-3 py-1 text-sm font-semibold transition-all"
				>
					Clear All
					<Icon
						name="cross-2"
						className="group-hover:text-destructive-foreground/80 h-3 w-3 stroke-3"
					/>
				</button>
			)}
		</div>
	)
}

type ActiveFilter = {
	type: 'venue-type' | 'price-range' | 'capacity-range'
	value: string
	label: string
}

function getActiveFilters(
	searchParams: URLSearchParams,
	capacityRanges: Record<string, boolean>,
): ActiveFilter[] {
	const filters: ActiveFilter[] = []
	const seenKeys = new Set<string>()

	// Process price range first
	const minPrice = searchParams.get('minPrice')
	const maxPrice = searchParams.get('maxPrice')
	if (minPrice && maxPrice) {
		filters.push({
			type: 'price-range',
			value: `${minPrice}-${maxPrice}`,
			label: `Tk: ${minPrice} - ${maxPrice}`,
		})
		seenKeys.add('minPrice')
		seenKeys.add('maxPrice')
	}

	// Process capacity filters
	const hasCapacityRange = Object.values(capacityRanges).some(Boolean)
	if (hasCapacityRange) {
		// Only show checkbox-based capacity ranges
		for (const [key, isActive] of Object.entries(capacityRanges)) {
			if (isActive) {
				filters.push({
					type: 'capacity-range',
					value: key,
					label:
						key === 'up-to-50'
							? `${formatLabel(key)} Guests`
							: key === '300+'
								? '300+ Guests'
								: `${key} Guests`,
				})
			}
		}
		seenKeys.add('minCapacity')
		seenKeys.add('maxCapacity')
	} else {
		// Fallback to min/max capacity if no checkboxes are checked
		const minCapacity = searchParams.get('minCapacity')
		const maxCapacity = searchParams.get('maxCapacity')
		if (minCapacity && maxCapacity) {
			filters.push({
				type: 'capacity-range',
				value: `${minCapacity}-${maxCapacity}`,
				label: `${minCapacity}-${maxCapacity} Guests`,
			})
			seenKeys.add('minCapacity')
			seenKeys.add('maxCapacity')
		}
	}

	// Process other filters
	for (const key of searchParams.keys()) {
		if (key === 'vendorType' || seenKeys.has(key)) continue

		const allValues = searchParams.getAll(key)
		if (allValues.length > 0) {
			for (const val of allValues) {
				filters.push({
					type: key as ActiveFilter['type'],
					value: val,
					label: formatLabel(val),
				})
			}
			seenKeys.add(key)
		}
	}

	return filters
}

function formatLabel(value: string): string {
	return value
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
