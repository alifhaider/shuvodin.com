import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { useId } from 'react'
import { useSearchParams } from 'react-router'
import { Icon } from '#app/components/ui/icon.tsx'
import { vendorTypes } from '#app/utils/constants.ts'
import { cn } from '#app/utils/misc.tsx'
import { type IconName } from '@/icon-name'

export function VendorCombobox() {
	const id = useId()
	const [searchParams, setSearchParams] = useSearchParams()

	const currentVendorType = searchParams.get('vendorType')

	// Find the corresponding vendor type object
	const selectedVendorType =
		vendorTypes.find((item) => item.slug === currentVendorType) ?? null

	const cb = useCombobox<(typeof vendorTypes)[number]>({
		id,
		items: vendorTypes,
		itemToString: (item) => (item ? item.title : ''),
		selectedItem: selectedVendorType,
		onInputValueChange: async ({ inputValue }) => {
			if (inputValue) {
				const selectedItem = vendorTypes.find(
					(item) => item.title.toLowerCase() === inputValue.toLowerCase(),
				)
				if (selectedItem) {
					setSearchParams((prev) => {
						const newParams = new URLSearchParams(prev)
						newParams.set('vendorType', selectedItem.slug)
						return newParams
					})
				} else {
					setSearchParams((prev) => {
						const newParams = new URLSearchParams(prev)
						newParams.delete('vendorType')
						return newParams
					})
				}
			} else {
				setSearchParams((prev) => {
					const newParams = new URLSearchParams(prev)
					newParams.delete('vendorType')
					return newParams
				})
			}
		},
		onSelectedItemChange: ({ selectedItem }) => {
			const newSearchParams = new URLSearchParams(searchParams)
			if (selectedItem?.slug) {
				newSearchParams.set('vendorType', selectedItem.slug)
			} else {
				newSearchParams.delete('vendorType')
			}
			setSearchParams(newSearchParams)
		},
	})

	const displayMenu = cb.isOpen && vendorTypes.length > 0
	const menuClassName =
		'absolute z-10 mt-4 min-w-md max-h-[336px] bg-white dark:bg-gray-800 shadow-lg rounded-sm w-full overflow-y-scroll'

	return (
		<div className="relative w-full flex-1 lg:max-w-md">
			<div className="flex flex-1 items-center gap-4">
				<label
					htmlFor={id}
					className="px-4 py-2 text-sm font-medium whitespace-nowrap"
				>
					<Icon
						name={(selectedVendorType?.icon as IconName) ?? 'flower'}
						className="h-5 w-5"
					/>
					<span className="sr-only">Vendor Type</span>
				</label>
				<div className="relative w-full">
					<input
						className="relative w-full bg-transparent outline-hidden"
						{...cb.getInputProps({
							id,
							placeholder: 'Vendor Type',
						})}
					/>
				</div>

				{selectedVendorType && (
					<button
						type="button"
						className="px-2 py-1"
						aria-label="Clear selection"
						onClick={() => {
							setSearchParams((prev) => {
								const newParams = new URLSearchParams(prev)
								newParams.delete('vendorType')
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
				{displayMenu &&
					vendorTypes.map((item, index) => (
						<li
							key={`vendor-${item.slug}`}
							{...cb.getItemProps({
								item,
								index,
								className: cn(
									'hover:bg-accent hover:text-accent-foreground cursor-pointer px-4 py-2 text-sm',
									{
										'bg-accent text-accent-foreground':
											selectedVendorType?.slug === item.slug,
									},
								),
							})}
						>
							<Icon name={item.icon as IconName} className="mr-2 h-4 w-4" />
							{item.title}
						</li>
					))}
			</ul>

			<input type="hidden" value={selectedVendorType?.slug ?? ''} />
		</div>
	)
}
