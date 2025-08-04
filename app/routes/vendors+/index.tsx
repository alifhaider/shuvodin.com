import clsx from 'clsx'
import React from 'react'
import { Form, useSearchParams } from 'react-router'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion.tsx'
import { Checkbox } from '#app/components/ui/checkbox.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select.tsx'
import { vendorTypes } from '#app/utils/constants.ts'
import { getFilterInputs } from '#app/utils/filters.ts'
import { LocationCombobox } from '../resources+/location-combobox'
import { VendorCombobox } from '../resources+/vendor-combobox'
import { type Route } from './+types/index.ts'

export const meta: Route.MetaFunction = () => {
	return [{ title: 'Vendors / ShuvoDin' }]
}

// Digital files
// Digital rights
// Online gallery
// Photo box
// Printed enlargements
// Same/next-day sneak-peek images
// Slideshow
// Video
// Wedding album

export async function loader({ request }: Route.LoaderArgs) {
	const searchParams = new URL(request.url).searchParams
	const vendorType = searchParams.get('vendorType') ?? ''
	const city = searchParams.get('city') ?? ''
	const address = searchParams.get('address') ?? ''
	const minPrice = searchParams.get('minPrice') ?? ''
	const maxPrice = searchParams.get('maxPrice') ?? ''
	const sortOrder = searchParams.get('sortOrder') ?? 'relevance'

	// const vendors = await prisma.$queryRawTyped(
	// 	getVendors(vendorType, city, address, minPrice, maxPrice, sortOrder),
	// )

	const vendors = {}
	return { vendors }
}

export default function VendorsPage() {
	const [searchParams, setSearchParams] = useSearchParams()

	const vendor = vendorTypes.find(
		(vendor) => vendor.slug === searchParams.get('vendorType'),
	)
	const vendorType = vendor ? vendor.title : 'Wedding'
	const city = searchParams.get('city') || ''
	const address = searchParams.get('address') || ''
	const location = city || address || 'Bangladesh'

	const breadcrumbs = [
		{ label: 'Home', to: '/' },
		{ label: 'Vendors', to: '/vendors' },
		{ label: vendorType, to: `/vendors/${vendor?.slug}` },
	]

	const renderFilters = () => {
		if (!vendorType) return null

		const filterInputs = getFilterInputs(vendorType)
		if (!filterInputs.length) return null

		const handleCheckboxChange = (
			name: string,
			isCapacityFilter: boolean,
			value: boolean | string,
		) => {
			if (isCapacityFilter) {
				setSearchParams((prev) => {
					const newParams = new URLSearchParams(prev)

					// Get current min/max values
					const currentMin = parseInt(prev.get('minCapacity') || '')
					const currentMax = parseInt(prev.get('maxCapacity') || '')

					// Calculate the new range from the checkbox
					let [newMin, newMax] = [0, 0]
					if (name === '300+') {
						newMin = 300
						newMax = Infinity
					} else if (name === 'upTo50') {
						newMin = 0
						newMax = 50
					} else {
						const [min, max] = name.split('-').map(Number)
						newMin = min ?? 0
						newMax = max ?? 0
					}

					// Determine new overall min/max
					let overallMin = isNaN(currentMin)
						? newMin
						: Math.min(currentMin, newMin)
					let overallMax = isNaN(currentMax)
						? newMax
						: Math.max(currentMax, newMax)

					// If unchecking, we need to recalculate from other checked boxes
					if (!value) {
						// This is more complex - we'd need to track checked states separately
						// For now, we'll just remove the params if unchecking
						newParams.delete('minCapacity')
						newParams.delete('maxCapacity')
						return newParams
					}

					// Update the params
					newParams.set('minCapacity', overallMin.toString())
					newParams.set(
						'maxCapacity',
						overallMax === Infinity ? '300+' : overallMax.toString(),
					)

					return newParams
				})
				return
			}

			// Handle non-capacity checkboxes
			const newSearchParams = new URLSearchParams(searchParams)
			value ? newSearchParams.set(name, 'true') : newSearchParams.delete(name)
			setSearchParams(newSearchParams)
		}

		const handleInputChange = (name: string, value: string) => {
			const newSearchParams = new URLSearchParams(searchParams)
			value ? newSearchParams.set(name, value) : newSearchParams.delete(name)
			setSearchParams(newSearchParams)
		}

		const isCapacityChecked = (name: string) => {
			const min = parseInt(searchParams.get('minCapacity') || '0')
			const maxStr = searchParams.get('maxCapacity')
			const max = maxStr === '300+' ? Infinity : parseInt(maxStr || '0')

			if (name === '300+') return max === Infinity
			if (name === 'upTo50') return min === 0 && max === 50

			const [rangeMin, rangeMax] = name.split('-').map(Number)
			return (
				rangeMin !== undefined &&
				rangeMax !== undefined &&
				min <= rangeMin &&
				max >= rangeMax
			)
		}

		return (
			<>
				{filterInputs.map((option) => {
					const isCapacityFilter = option.title === 'Capacity'
					return (
						<AccordionItem key={option.title} value={option.value}>
							<AccordionTrigger className="cursor-pointer text-lg font-bold">
								{option.title}
							</AccordionTrigger>
							<AccordionContent className="flex flex-col gap-4 px-2 text-balance">
								{option.inputs.map((input) => {
									const isChecked = isCapacityFilter
										? isCapacityChecked(input.name)
										: searchParams.get(input.name) === 'true'
									const defaultValue = searchParams.get(input.name) || ''
									return (
										<React.Fragment key={input.name}>
											{input.type === 'checkbox' ? (
												<div className="flex items-start gap-3">
													<Checkbox
														id={input.name}
														defaultChecked={isChecked}
														onCheckedChange={(value) =>
															handleCheckboxChange(
																input.name,
																isCapacityFilter,
																value,
															)
														}
													/>
													<div className="grid gap-2">
														<Label htmlFor={input.name}>{input.label}</Label>
														{input.description ? (
															<p className="text-muted-foreground text-sm">
																{input.description}
															</p>
														) : null}
													</div>
												</div>
											) : (
												<div
													className="grid w-full max-w-sm items-center gap-3"
													key={input.name}
												>
													<Label htmlFor={input.name}>{input.label}</Label>
													<Input
														type={input.type}
														id={input.name}
														placeholder={input.placeholder}
														defaultValue={defaultValue}
														onChange={(e) =>
															handleInputChange(input.name, e.target.value)
														}
													/>
													{input.description ? (
														<p className="text-muted-foreground text-sm">
															{input.description}
														</p>
													) : null}
												</div>
											)}
										</React.Fragment>
									)
								})}
							</AccordionContent>
						</AccordionItem>
					)
				})}
			</>
		)
	}

	const renderBreadcrumbs = () => (
		<nav>
			<ul className="flex space-x-1">
				{breadcrumbs.map((breadcrumb, index) => (
					<li key={index}>
						<a
							href={breadcrumb.to}
							className="text-primary text-base hover:underline"
						>
							{breadcrumb.label}
						</a>
						{index < breadcrumbs.length - 1 && (
							<span>
								<Icon name="chevron-right" className="mx-1 h-4 w-4" />
							</span>
						)}
					</li>
				))}
			</ul>
		</nav>
	)

	const selectedFilters = Object.fromEntries(
		Array.from(searchParams.entries()).filter(
			([key, value]) =>
				value && key !== 'vendorType' && key !== 'city' && key !== 'address',
		),
	)

	return (
		<>
			<section className="from-primary/10 via-accent/5 to-secondary/10 border-b bg-gradient-to-r py-12">
				<div className="container space-y-6">
					{renderBreadcrumbs()}
					<div className="max-w-4xl space-y-3">
						<h1 className="font-serif text-xl font-bold capitalize md:text-4xl">
							The Best <span className="text-primary">{vendorType}</span>{' '}
							Vendors in {location}
						</h1>
						<p className="text-muted-foreground max-w-3xl text-base">
							Discover the best wedding vendors in {location}. Explore top-rated
							vendors offering exceptional services.
						</p>
					</div>

					{/* Search Bar */}
					<div className="flex w-full flex-col gap-4 lg:flex-row">
						<LocationCombobox />
						<VendorCombobox />
					</div>
				</div>
			</section>
			<section className="container flex items-start gap-6">
				<div className={clsx('w-1/4', vendor ? 'block' : 'hidden')}>
					<Form method="get" className="space-y-4">
						<Accordion type="multiple" className="w-full">
							{renderFilters()}
						</Accordion>
					</Form>
				</div>
				<div className="flex flex-1 items-start justify-between border-b py-4">
					<div>
						<p className="text-sm md:text-base">100+ Wedding Vendors Found</p>
						{Object.keys(selectedFilters).length > 0 && (
							<p className="text-sm md:text-base">
								Selected Filters:{' '}
								{Object.keys(selectedFilters)
									.map((key) => `${key}`)
									.join(', ')}
							</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm md:text-base">Sort by:</span>
						<Select>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Sort By" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Sort Options</SelectLabel>
									<SelectItem value="relevance">Relevance</SelectItem>
									<SelectItem value="price">Price</SelectItem>
									<SelectItem value="rating">Rating</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</div>
			</section>
		</>
	)
}
