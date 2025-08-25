import React from 'react'
import { useSearchParams } from 'react-router'
import { Icon } from './ui/icon'

type FilterType = 'venue-type' | 'price-range' | 'capacity' | string

interface ActiveFilter {
	type: FilterType
	value: string
	label: string
}

export function FilterChips() {
	const [searchParams, setSearchParams] = useSearchParams()
	const activeFilters = useActiveFilters(searchParams)

	const handleStandardFilterRemove = (
		filterType: string,
		filterValue: string,
		params: URLSearchParams,
	) => {
		const currentValues = params.getAll(filterType)

		if (currentValues.length > 1) {
			// Remove just this value from multi-value params
			const updatedValues = currentValues.filter((v) => v !== filterValue)
			params.delete(filterType)
			updatedValues.forEach((v) => params.append(filterType, v))
		} else {
			// Remove single-value param completely
			params.delete(filterType)
		}
	}

	const handleRemoveFilter = (filter: ActiveFilter) => {
		const newParams = new URLSearchParams(searchParams)
		console.log('Removing filter:', filter)

		switch (filter.type) {
			case 'price-range':
				newParams.delete('minPrice')
				newParams.delete('maxPrice')
				break
			default:
				handleStandardFilterRemove(filter.type, filter.value, newParams)
		}

		setSearchParams(newParams)
	}

	const handleClearAll = () => {
		setSearchParams(new URLSearchParams())
		// Clear all capacity ranges in the ref
	}

	if (activeFilters.length === 0) return null

	return (
		<div className="flex flex-wrap gap-2">
			{activeFilters.map((filter) => (
				<FilterChip
					key={`${filter.type}-${filter.value}`}
					filter={filter}
					onRemove={handleRemoveFilter}
				/>
			))}
			{activeFilters.length > 0 && activeFilters[0]?.label && (
				<ClearAllButton onClear={handleClearAll} />
			)}
		</div>
	)
}

// Helper Components
const FilterChip = ({
	filter,
	onRemove,
}: {
	filter: ActiveFilter
	onRemove: (f: ActiveFilter) => void
}) => {
	if (!filter.label) return null
	return (
		<button
			onClick={() => onRemove(filter)}
			className="border-secondary group hover:border-primary/80 flex items-center gap-2 rounded-lg border px-3 py-1 text-sm font-semibold transition-all"
		>
			{filter.label}
			<Icon
				name="cross-2"
				className="group-hover:text-primary/80 h-3 w-3 stroke-3"
			/>
		</button>
	)
}

const ClearAllButton = ({ onClear }: { onClear: () => void }) => (
	<button
		onClick={onClear}
		className="border-secondary-foreground group hover:border-destructive hover:text-destructive flex items-center gap-2 rounded-lg border px-3 py-[3px] text-sm font-semibold transition-all"
	>
		Clear All
		<Icon
			name="cross-2"
			className="group-hover:text-destructive/80 h-3 w-3 stroke-3"
		/>
	</button>
)

// hook to get active filters i.e minPrice=0&maxPrice=1000&capacityMin=50&capacityMax=200
function useActiveFilters(searchParams: URLSearchParams) {
	return React.useMemo(() => {
		const filters: ActiveFilter[] = []
		const processedKeys = new Set<string>()

		// Helper functions
		const addPriceFilter = () => {
			const minPrice = searchParams.get('minPrice')
			const maxPrice = searchParams.get('maxPrice')

			if (!minPrice && !maxPrice) return

			processedKeys.add('minPrice')
			processedKeys.add('maxPrice')

			if (minPrice && maxPrice) {
				filters.push({
					type: 'price-range',
					value: `${minPrice}-${maxPrice}`,
					label: `Tk: ${minPrice} - ${maxPrice}`,
				})
			} else if (minPrice) {
				filters.push({
					type: 'price-range',
					value: minPrice,
					label: `Tk: ${minPrice} and above`,
				})
			} else if (maxPrice) {
				filters.push({
					type: 'price-range',
					value: maxPrice,
					label: `Up to Tk: ${maxPrice}`,
				})
			}
		}

		const addCapacityFilters = () => {
			const capacityRanges = searchParams.getAll('capacity')

			if (capacityRanges.length > 0) {
				capacityRanges.forEach((range) => {
					filters.push({
						type: 'capacity',
						value: range,
						label: getCapacityLabel(range), // Same as before
					})
				})
			}
			processedKeys.add('capacity')
		}

		const addOtherFilters = () => {
			for (const [key, value] of searchParams.entries()) {
				if (key === 'vendorType' || processedKeys.has(key)) continue

				filters.push({
					type: key,
					value,
					label: formatLabel(value),
				})
			}
		}

		// Process all filters
		addPriceFilter()
		addCapacityFilters()
		addOtherFilters()

		return filters
	}, [searchParams])
}

function getCapacityLabel(key: string): string {
	switch (key) {
		case 'up-to-50':
			return 'Up To 50 Guests'
		case '300+':
			return '300+ Guests'
		default:
			return `${key} Guests`
	}
}

function formatLabel(value: string): string {
	return value
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
