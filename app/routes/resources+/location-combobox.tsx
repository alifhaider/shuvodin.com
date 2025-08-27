import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { useId, useMemo } from 'react'
import { useFetcher, useSearchParams } from 'react-router'
import { useSpinDelay } from 'spin-delay'
import { Spinner } from '#app/components/spinner.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { getLocations } from '#app/utils/locations.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { type Route } from './+types/location-combobox'

export async function loader({ request }: Route.LoaderArgs) {
	const locations = getLocations(request)
	return locations
}

export function LocationCombobox() {
	const id = useId()
	const [searchParams, setSearchParams] = useSearchParams()
	const locationFetcher = useFetcher<typeof loader>()

	const currentDivision = searchParams.get('division')
	const currentDistrict = searchParams.get('district')
	const currentThana = searchParams.get('thana')

	const selectedItem = useMemo(() => {
		// Prioritize division over district if both exist
		if (currentDivision) {
			return { type: 'division' as const, value: currentDivision }
		}
		if (currentDistrict) {
			return { type: 'district' as const, value: currentDistrict }
		}
		if (currentThana) {
			return { type: 'thana' as const, value: currentThana }
		}
		return null
	}, [currentDivision, currentDistrict, currentThana])

	const divisions = useMemo(
		() =>
			locationFetcher.data?.divisions.map((division) => ({
				type: 'division',
				value: division,
			})) || [],
		[locationFetcher.data],
	)

	const districts = useMemo(
		() =>
			locationFetcher.data?.districts.map((district) => ({
				type: 'district',

				value: district,
			})) || [],
		[locationFetcher.data],
	)

	const thanas = useMemo(
		() =>
			locationFetcher.data?.thanas?.map((thana) => ({
				type: 'thana',
				value: thana,
			})) || [],
		[locationFetcher.data],
	)

	const items = [...divisions, ...districts, ...thanas]

	const cb = useCombobox<(typeof items)[number]>({
		id,
		items,
		itemToString: (item) => (item ? item.value : ''),
		selectedItem: selectedItem,
		onInputValueChange: async ({ inputValue }) => {
			if (inputValue) {
				await locationFetcher.submit(
					{ query: inputValue ?? '' },
					{ method: 'get', action: '/resources/location-combobox' },
				)
			} else {
				setSearchParams((prev) => {
					const newParams = new URLSearchParams(prev)
					newParams.delete('division')
					newParams.delete('district')
					newParams.delete('thana')
					return newParams
				})
			}
		},
		onSelectedItemChange: ({ selectedItem }) => {
			const newSearchParams = new URLSearchParams(searchParams)

			// Clear both params first
			newSearchParams.delete('division')
			newSearchParams.delete('district')
			newSearchParams.delete('thana')

			// Then set the selected one
			if (selectedItem?.value) {
				newSearchParams.set(selectedItem.type, selectedItem.value)
			}

			setSearchParams(newSearchParams)
		},
	})

	const displayMenu =
		cb.isOpen &&
		(divisions.length > 0 || districts.length > 0 || thanas.length > 0)
	const menuClassName =
		'absolute z-10 mt-4 min-w-md max-h-[336px] bg-white dark:bg-gray-800 shadow-lg rounded-sm w-full overflow-y-scroll'

	const busy = locationFetcher.state !== 'idle'
	const showSpinner = useSpinDelay(busy, {
		delay: 150,
		minDuration: 300,
	})

	return (
		<div className="relative w-full flex-1 lg:max-w-md">
			<div className="flex flex-1 items-center gap-4">
				<label
					htmlFor={id}
					className="px-4 py-2 text-sm font-medium whitespace-nowrap"
				>
					<span className="sr-only">Location</span>
					<Icon name="map-pin" className="h-5 w-5" />
				</label>
				<div className="relative w-full">
					<input
						key={id}
						className="relative w-full bg-transparent outline-hidden"
						{...cb.getInputProps({
							id,
							placeholder: 'Division, District or Thana',
						})}
					/>
					<div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center">
						<Spinner showSpinner={showSpinner} />
					</div>
				</div>

				{selectedItem && (
					<button
						type="button"
						className="px-2 py-1"
						aria-label="Clear selection"
						onClick={() => {
							setSearchParams((prev) => {
								const newParams = new URLSearchParams(prev)
								newParams.delete('division')
								newParams.delete('district')
								return newParams
							})
							cb.reset()
						}}
					>
						<Icon
							name="cross-2"
							className="text-muted-foreground hover:text-foreground h-4 w-4"
						/>
					</button>
				)}
			</div>

			<ul
				{...cb.getMenuProps({
					className: clsx(menuClassName, { hidden: !displayMenu }),
				})}
			>
				{displayMenu && divisions.length > 0 && (
					<>
						<h5 className="mt-4 mb-2 px-2 text-sm font-bold text-gray-950 dark:text-gray-50">
							Divisions
						</h5>
						{divisions.map((item, index) => (
							<li
								key={`division-${item.value}`}
								{...cb.getItemProps({
									item,
									index,
									className: cn(
										'hover:bg-accent hover:text-accent-foreground cursor-pointer px-4 py-2 text-sm',
										{
											'bg-accent text-accent-foreground':
												selectedItem?.value === item.value,
										},
									),
								})}
							>
								{item.value}
							</li>
						))}
					</>
				)}

				{displayMenu && districts.length > 0 && (
					<>
						<hr className="border-accent mx-4 my-1" />
						<h5 className="mt-4 mb-2 px-2 text-sm font-bold text-gray-950 dark:text-gray-50">
							Districts
						</h5>
						{districts.map((district, index) => (
							<li
								key={`district-${district.value}`}
								{...cb.getItemProps({
									item: district,
									index: districts.length + index, // Important for correct indexing
									className: cn(
										'hover:bg-accent hover:text-accent-foreground cursor-pointer px-4 py-2 text-sm',
										{
											'bg-accent text-accent-foreground':
												selectedItem?.value === district.value,
										},
									),
								})}
							>
								{district.value}
							</li>
						))}
					</>
				)}

				{displayMenu && thanas.length > 0 && (
					<>
						<hr className="border-accent mx-4 my-1" />
						<h5 className="mt-4 mb-2 px-2 text-sm font-bold text-gray-950 dark:text-gray-50">
							Thanas
						</h5>
						{thanas.map((thana, index) => (
							<li
								key={`thana-${thana.value}`}
								{...cb.getItemProps({
									item: thana,
									index: divisions.length + districts.length + index, // Important for correct indexing
									className: cn(
										'hover:bg-accent hover:text-accent-foreground cursor-pointer px-4 py-2 text-sm',
										{
											'bg-accent text-accent-foreground':
												selectedItem?.value === thana.value,
										},
									),
								})}
							>
								{thana.value}
							</li>
						))}
					</>
				)}
			</ul>

			<input type="hidden" value={selectedItem?.value ?? ''} />
		</div>
	)
}
