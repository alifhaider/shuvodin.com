import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { useId } from 'react'
import { useSearchParams } from 'react-router'
import { vendorTypes } from '#app/utils/constants.ts'
import { cn } from '#app/utils/misc.tsx'

export function VendorCombobox() {
	const [searchParams, setSearchParams] = useSearchParams()
	const id = useId()
	const cb = useCombobox<(typeof vendorTypes)[number]>({
		id,
		items: vendorTypes,
		itemToString: (item) => (item ? item.title : ''),
		initialSelectedItem:
			vendorTypes.find(
				(item) => item.slug === searchParams.get('vendorType'),
			) ?? null,
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
		'absolute z-10 mt-4 min-w-[448px] max-h-[336px] bg-background shadow-lg rounded-sm w-full overflow-y-scroll'

	return (
		<div className="relative max-w-[350px] flex-1">
			<div className="flex w-full max-w-[350px] flex-1 items-center gap-4 border-b">
				<label htmlFor={id} className="text-brand">
					Vendor Type
				</label>
				<div className="relative w-full">
					<input
						className="relative w-full bg-transparent outline-hidden"
						{...cb.getInputProps({
							id,
							placeholder: 'Select Vendor Type',
						})}
					/>
				</div>
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
											cb.selectedItem?.slug === item.slug,
									},
								),
							})}
						>
							{item.title}
						</li>
					))}
			</ul>

			<input type="hidden" value={cb.selectedItem?.slug ?? ''} />
		</div>
	)
}
