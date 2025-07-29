import { useCombobox } from 'downshift'
import { useId } from 'react'
import { data, useFetcher, useSearchParams } from 'react-router'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/location-combobox'
import { Label } from '#app/components/ui/label.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { useSpinDelay } from 'spin-delay'
import { Spinner } from '#app/components/spinner.tsx'
import clsx from 'clsx'
import { cn } from '#app/utils/misc.tsx'
import { getInputProps } from '@conform-to/react'

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
	const [searchParams, setSearchParams] = useSearchParams()
	const locationFetcher = useFetcher<typeof loader>()
	const id = useId()

	const cities =
		locationFetcher.data?.cities.map((city) => ({
			type: 'city',
			value: city,
		})) ?? []

	const addresses =
		locationFetcher.data?.addresses.map((address) => ({
			type: 'address',
			value: address,
		})) ?? []

	const items = [...cities, ...addresses]

	const cb = useCombobox<(typeof items)[number]>({
		id,
		items,
		itemToString: (item) => (item ? item.value : ''),
		initialSelectedItem: null,
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
				console.log('selectedItem', selectedItem)
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
		'absolute z-10 mt-4 min-w-[448px] max-h-[336px] bg-background shadow-lg rounded-sm w-full overflow-y-scroll'

	const busy = locationFetcher.state !== 'idle'
	const showSpinner = useSpinDelay(busy, {
		delay: 150,
		minDuration: 300,
	})

	return (
		<div className="relative max-w-[350px] flex-1">
			<div className="flex w-full max-w-[350px] flex-1 items-center gap-4 border-b">
				<label htmlFor={id} className="text-brand">
					Location
				</label>
				<div className="relative w-full">
					<input
						className="relative w-full bg-transparent outline-hidden"
						{...cb.getInputProps({
							id,
							placeholder: 'District, Division or Zip Code',
						})}
					/>
					<div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center">
						{/* TODO: spinner is not visible */}
						<Spinner showSpinner={showSpinner} />
					</div>
				</div>
			</div>

			<ul
				{...cb.getMenuProps({
					className: clsx(menuClassName, { hidden: !displayMenu }),
				})}
			>
				{displayMenu && (
					<>
						{cities.length > 0 && (
							<>
								<h5 className="text-muted-foreground mt-4 mb-2 px-2 text-sm font-semibold">
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
														cb.selectedItem?.value === item.value,
												},
											),
										})}
									>
										{item.value}
									</li>
								))}
							</>
						)}

						{addresses.length > 0 && (
							<>
								<h5 className="text-muted-foreground mt-4 mb-2 px-2 text-sm font-semibold">
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
														cb.selectedItem?.value === item.value,
												},
											),
										})}
									>
										{item.value}
									</li>
								))}
							</>
						)}
					</>
				)}
			</ul>

			<input type="hidden" value={cb.selectedItem?.value ?? ''} />
		</div>
	)
}
