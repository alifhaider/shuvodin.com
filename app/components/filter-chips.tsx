import React from 'react'
import { useSearchParams } from 'react-router'
import { Icon } from './ui/icon'

type FilterType = 'venue-type' | 'price-range' | 'capacity-range' | string

interface ActiveFilter {
	type: FilterType
	value: string
	label: string
}

interface FilterChipsProps {
	$capacityRanges: React.RefObject<Record<string, boolean>>
	$form: React.RefObject<HTMLFormElement | null>
}

export function FilterChips({ $capacityRanges, $form }: FilterChipsProps) {
	const [searchParams, setSearchParams] = useSearchParams()
	const activeFilters = useActiveFilters(searchParams, $capacityRanges.current)

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

		switch (filter.type) {
			case 'capacity-range':
				handleCapacityRangeRemove(filter.value, newParams)
				break
			case 'price-range':
				newParams.delete('minPrice')
				newParams.delete('maxPrice')
				break
			default:
				handleStandardFilterRemove(filter.type, filter.value, newParams)
		}

		setSearchParams(newParams)
	}

	const handleCapacityRangeRemove = (
		value: string,
		params: URLSearchParams,
	) => {
		$capacityRanges.current[value] = false

		const checkedRanges = getCheckedRanges($capacityRanges.current)
		updateCapacityParams(checkedRanges, params)
	}

	const handleClearAll = () => {
		setSearchParams(new URLSearchParams())
		// Clear all capacity ranges in the ref
		Object.keys($capacityRanges.current).forEach((key) => {
			$capacityRanges.current[key] = false
		})
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
			<ClearAllButton onClear={handleClearAll} />
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
}) => (
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
function useActiveFilters(
	searchParams: URLSearchParams,
	capacityRanges: Record<string, boolean>,
) {
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
			const activeCapacityRanges = Object.entries(capacityRanges)
				.filter(([, isActive]) => isActive)
				.map(([key]) => key)

			if (activeCapacityRanges.length > 0) {
				activeCapacityRanges.forEach((key) => {
					filters.push({
						type: 'capacity-range',
						value: key,
						label: getCapacityLabel(key),
					})
				})
			} else {
				const minCapacity = searchParams.get('minCapacity')
				const maxCapacity = searchParams.get('maxCapacity')

				if (minCapacity && maxCapacity) {
					filters.push({
						type: 'capacity-range',
						value: `${minCapacity}-${maxCapacity}`,
						label: `${minCapacity}-${maxCapacity} Guests`,
					})
				}
			}

			processedKeys.add('minCapacity')
			processedKeys.add('maxCapacity')
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
	}, [searchParams, capacityRanges])
}

// Helper Functions
function getCheckedRanges(ranges: Record<string, boolean>) {
	return Object.entries(ranges)
		.filter(([, isChecked]) => isChecked)
		.map(([name]) => {
			if (name === '300+') return [300]
			if (name === 'up-to-50') return [0, 50]
			return name.split('-').map(Number)
		})
}

function updateCapacityParams(
	checkedRanges: number[][],
	params: URLSearchParams,
) {
	if (checkedRanges.length === 0) {
		params.delete('minCapacity')
		params.delete('maxCapacity')
		return
	}

	const newMin = Math.min(...checkedRanges.map((range) => range[0] || 0))
	const newMax = Math.max(...checkedRanges.map((range) => range[1] || 0))

	if (checkedRanges.some((range) => range[0] === 300)) {
		params.set('minCapacity', '300')
		params.delete('maxCapacity')
	} else {
		params.set('minCapacity', newMin.toString())
		params.set('maxCapacity', newMax.toString())
	}
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
