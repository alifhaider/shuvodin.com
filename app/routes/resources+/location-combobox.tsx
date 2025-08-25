import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { useId, useMemo } from 'react'
import { data, useFetcher, useSearchParams } from 'react-router'
import { useSpinDelay } from 'spin-delay'
import { Spinner } from '#app/components/spinner.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { type Route } from './+types/location-combobox'
import { Icon } from '#app/components/ui/icon.tsx'

export async function loader({ request }: Route.LoaderArgs) {
	const searchParams = new URL(request.url).searchParams
	const query = searchParams.get('query')?.toLocaleLowerCase()

	const locations = await prisma.vendorLocation.findMany({
		where: {
			OR: [{ city: { contains: query } }, { address: { contains: query } }],
		},
		select: {
			address: true,
			city: true,
		},
		distinct: ['city', 'address'],
	})

	// Create sets to avoid duplicates
	const cities = new Set<string>()
	const addresses = new Set<string>()

	// Populate the sets
	locations.forEach((location) => {
		if (location.city) cities.add(location.city)
		if (location.address) addresses.add(location.address)
	})

	return data({
		cities: Array.from(cities),
		addresses: Array.from(addresses),
	})
}

export function LocationCombobox() {
	const id = useId()
	const [searchParams, setSearchParams] = useSearchParams()
	const locationFetcher = useFetcher<typeof loader>()

	const currentCity = searchParams.get('city')
	const currentAddress = searchParams.get('address')

	const selectedItem = useMemo(() => {
		return currentCity
			? { type: 'city' as const, value: currentCity }
			: currentAddress
				? { type: 'address' as const, value: currentAddress }
				: null
	}, [currentCity, currentAddress])

	const initialItems = selectedItem ? [selectedItem] : []

	const cities =
		locationFetcher.data?.cities.map((city) => ({
			type: 'city',
			value: city,
		})) ?? initialItems.filter((item) => item.type === 'city')

	const addresses =
		locationFetcher.data?.addresses.map((address) => ({
			type: 'address',
			value: address,
		})) ?? initialItems.filter((item) => item.type === 'address')

	const items = [...cities, ...addresses]

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
					newParams.delete('city')
					newParams.delete('address')
					return newParams
				})
			}
		},
		onSelectedItemChange: ({ selectedItem }) => {
			const newSearchParams = new URLSearchParams(searchParams)
			if (selectedItem?.value) {
				newSearchParams.set(selectedItem.type, selectedItem.value)
			} else {
				newSearchParams.delete('city')
				newSearchParams.delete('address')
			}
			setSearchParams(newSearchParams)
		},
	})

	const displayMenu = cb.isOpen && (cities.length > 0 || addresses.length > 0)
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
							placeholder: 'Location',
						})}
					/>
					<div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center">
						<Spinner showSpinner={showSpinner} />
					</div>
				</div>
			</div>

			<ul
				{...cb.getMenuProps({
					className: clsx(menuClassName, { hidden: !displayMenu }),
				})}
			>
				{displayMenu && cities.length > 0 && (
					<>
						<h5 className="mt-4 mb-2 px-2 text-sm font-bold text-gray-950 dark:text-gray-50">
							Cities
						</h5>
						{cities.map((item, index) => (
							<li
								key={`city-${item.value}`}
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

				<hr className="border-accent mx-4 my-1" />

				{addresses.length > 0 && (
					<>
						<h5 className="mt-4 mb-2 px-2 text-sm font-bold text-gray-950 dark:text-gray-50">
							Addresses
						</h5>
						{addresses.map((item, index) => (
							<li
								key={`address-${item.value}`}
								{...cb.getItemProps({
									item,
									index: cities.length + index, // Important for correct indexing
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
			</ul>

			<input type="hidden" value={selectedItem?.value ?? ''} />
		</div>
	)
}
