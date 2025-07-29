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

export async function loader({ params, request }: Route.LoaderArgs) {
	const searchParams = new URL(request.url).searchParams
	const query = searchParams.get('query')?.toLocaleLowerCase()
	const locations = await prisma.vendor.findMany({
		where: {
			OR: [{ city: { contains: query } }, { address: { contains: query } }],
		},
		select: {
			address: true,
			city: true,
		},
		distinct: ['city', 'address'],
	})
	return data({ items: locations })
}

export function LocationCombobox({
	variant = 'default',
}: {
	variant?: 'search' | 'default'
}) {
	const [searchParams, setSearchParams] = useSearchParams()
	const locationFetcher = useFetcher<typeof loader>()
	const id = useId()

	const items = locationFetcher.data?.items ?? []

	const cb = useCombobox<{ city: string; address: string | null }>({
		id,
		items,
		itemToString: (item) => (item ? item.city : ''),
		initialSelectedItem: null,
		onInputValueChange: async ({ inputValue }) => {
			// TODO: remove locationId from searchParams when user changes input value of location-combobox

			if (inputValue) {
				await locationFetcher.submit(
					{ query: inputValue ?? '' },
					{ method: 'get', action: '/resources/location-combobox' },
				)
			} else {
				setSearchParams((prev) => {
					const newParams = new URLSearchParams(prev)
					newParams.delete('locationId')
					return newParams
				})
			}
		},
		onSelectedItemChange: ({ selectedItem }) => {
			if (variant !== 'search') return
			const newSearchParams = new URLSearchParams(searchParams)
			if (selectedItem?.city) {
				newSearchParams.set(
					'locationId',
					selectedItem.address ?? selectedItem.city,
				)
			} else {
				newSearchParams.delete('locationId')
			}
			setSearchParams(newSearchParams)
		},
	})

	const displayMenu = cb.isOpen && items.length > 0
	const menuClassName =
		'absolute z-10 mt-4 min-w-[448px] max-h-[336px] bg-background shadow-lg rounded-sm w-full overflow-y-scroll'

	const busy = locationFetcher.state !== 'idle'
	const showSpinner = useSpinDelay(busy, {
		delay: 150,
		minDuration: 300,
	})

	return (
		<div className="relative max-w-[350px] flex-1">
			{variant === 'default' ? (
				<div className="group relative space-y-2">
					<Label htmlFor={id}>Location</Label>
					<div className="relative">
						<Input
							className="relative caret-black outline-hidden"
							{...cb.getInputProps({ id, placeholder: 'Choose a location' })}
						/>
						<div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center">
							<Spinner showSpinner={showSpinner} />
						</div>
					</div>
				</div>
			) : (
				<div className="flex w-full max-w-[350px] flex-1 items-center gap-4 border-b">
					<label htmlFor={id} className="text-brand">
						Where
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
			)}

			<ul
				{...cb.getMenuProps({
					className: clsx(menuClassName, { hidden: !displayMenu }),
				})}
			>
				{displayMenu
					? items.map((item, index) => (
							<li
								className="hover:text-brand group my-2 cursor-pointer py-1"
								key={index}
								{...cb.getItemProps({ item: item, index })}
							>
								<div
									className={cn(
										'hover:bg-muted flex w-full items-center gap-2 rounded-sm border border-transparent px-2 py-2 transition-all',
										{
											'border-brand text-brand': cb.highlightedIndex === index,
										},
									)}
								>
									<div className="flex flex-col">
										<strong>{item.city}</strong>
										<span className="text-muted-foreground group-hover:text-brand mb-0.5 text-xs">
											{item.address}
										</span>
									</div>
								</div>
							</li>
						))
					: null}
			</ul>
			<input type="hidden" value={cb.selectedItem?.city ?? ''} />
		</div>
	)
}
