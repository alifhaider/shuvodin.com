import clsx from 'clsx'
import React from 'react'
import { Form, Link, useSearchParams } from 'react-router'
import { FilterChips } from '#app/components/filter-chips.tsx'
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
import { getFilterInputs } from '#app/utils/filters.server.ts'
import { useDebounce } from '#app/utils/misc.tsx'
import { LocationCombobox } from '../resources+/location-combobox'
import { VendorCombobox } from '../resources+/vendor-combobox'
import { type Route } from './+types/index.ts'
import { Image } from 'openimg/react'

// TODO: clearing filter chips not updating form inputs

export const meta: Route.MetaFunction = () => {
	return [{ title: 'Vendors / ShuvoDin' }]
}

export async function loader({ request }: Route.LoaderArgs) {
	const searchParams = new URL(request.url).searchParams
	const vendorType = searchParams.get('vendorType') ?? ''
	const city = searchParams.get('city') ?? ''
	const address = searchParams.get('address') ?? ''
	const minPrice = searchParams.get('minPrice') ?? ''
	const maxPrice = searchParams.get('maxPrice') ?? ''
	const sortOrder = searchParams.get('sortOrder') ?? 'relevance'

	const filterSchema = getFilterInputs(vendorType)

	// const vendors = await prisma.$queryRawTyped(
	// 	getVendors(vendorType, city, address, minPrice, maxPrice, sortOrder),
	// )

	const vendors = {}
	return { vendors, filterSchema }
}

export default function VendorsPage({ loaderData }: Route.ComponentProps) {
	const capacityRangesRef = React.useRef<Record<string, boolean>>({})
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

	const isFilterChecked = (filterCategory: string, filterName: string) => {
		if (filterCategory === 'Capacity') {
			const min = parseInt(searchParams.get('minCapacity') || '0')
			const maxStr = searchParams.get('maxCapacity')
			const max = maxStr === '300+' ? Infinity : parseInt(maxStr || '0')

			if (filterName === '300+') return max === Infinity
			if (filterName === 'up-to-50') return min === 0 && max === 50

			const [rangeMin, rangeMax] = filterName.split('-').map(Number)
			return (
				rangeMin !== undefined &&
				rangeMax !== undefined &&
				min <= rangeMin &&
				max >= rangeMax
			)
		}

		// For all other filters
		const paramName = filterCategory.toLowerCase()
		return searchParams.getAll(paramName).includes(filterName)
	}

	const handleInputChange = useDebounce((name: string, value: string) => {
		const newSearchParams = new URLSearchParams(searchParams)
		value ? newSearchParams.set(name, value) : newSearchParams.delete(name)
		setSearchParams(newSearchParams)
	}, 400)

	const handleCheckboxChange = (
		filterCategory: string,
		filterName: string,
		value: boolean | string,
	) => {
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev)

			// Special case for capacity filters
			if (filterCategory === 'capacity') {
				capacityRangesRef.current[filterName] = value as boolean

				const checkedRanges = Object.entries(capacityRangesRef.current)
					.filter(([, isChecked]) => isChecked)
					.map(([name]) => {
						if (name === '300+') return [300]
						if (name === 'up-to-50') return [0, 50]
						return name.split('-').map(Number)
					})

				if (checkedRanges.length > 0) {
					const newMin = Math.min(
						...checkedRanges.map((range) => range[0] || 0),
					)
					const newMax = Math.max(
						...checkedRanges.map((range) => range[1] || 0),
					)
					// if 300+ is checked, remove maxCapacity and make minCapacity 300
					if (checkedRanges.some((range) => range[0] === 300)) {
						newParams.set('minCapacity', '300')
						newParams.delete('maxCapacity')
					} else {
						newParams.set('minCapacity', newMin.toString())
						newParams.set('maxCapacity', newMax.toString())
					}
				} else {
					newParams.delete('minCapacity')
					newParams.delete('maxCapacity')
				}

				return newParams
			}

			// Handle all other filter types
			const paramName = filterCategory.toLowerCase()
			const currentValues = newParams.getAll(paramName)

			if (value) {
				// Add filter if not already present
				if (!currentValues.includes(filterName)) {
					newParams.append(paramName, filterName)
				}
			} else {
				// Remove filter
				const updatedValues = currentValues.filter((v) => v !== filterName)
				newParams.delete(paramName)
				updatedValues.forEach((v) => newParams.append(paramName, v))
			}

			return newParams
		})
	}

	const renderFilters = () => {
		if (!vendorType) return null

		const filterInputs = loaderData.filterSchema
		if (!filterInputs.length) return null

		return (
			<>
				{filterInputs.map((option) => {
					return (
						<AccordionItem key={option.title} value={option.value}>
							<AccordionTrigger className="cursor-pointer text-lg font-bold">
								{option.title}
							</AccordionTrigger>
							<AccordionContent className="flex flex-col gap-4 px-2 text-balance">
								{option.inputs.map((input) => {
									const defaultValue = searchParams.get(input.name) || ''
									const isChecked =
										input.type === 'checkbox'
											? isFilterChecked(option.title, input.name)
											: undefined
									return (
										<React.Fragment key={input.name}>
											{input.type === 'checkbox' ? (
												<div className="flex items-start gap-3">
													<Checkbox
														id={input.name}
														defaultChecked={isChecked}
														onCheckedChange={(value) =>
															handleCheckboxChange(
																option.value,
																input.name,
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

	const selectedFilters: Record<string, string> = {}
	searchParams.forEach((value, key) => {
		if (key !== 'vendorType' && key !== 'city' && key !== 'address') {
			selectedFilters[key] = value
		}
	})

	console.log('Selected Filters:', selectedFilters)

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
				<div className="flex-1">
					<div className="flex w-full items-start justify-between border-b py-4">
						<div className="space-y-2">
							<p className="text-sm md:text-base">100+ Wedding Vendors Found</p>

							<FilterChips capacityRangesRef={capacityRangesRef} />
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

					<div className="divide-y">
						<Link to="/vendors/1" className="my-4 flex gap-4 md:gap-6">
							<Image
								src="/img/placeholder.png"
								alt="Vendor 1"
								width={412}
								height={240}
								className="h-60 w-full object-cover"
							/>
							<div>
								<div className="flex items-center">
									<h4 className="text-xl font-extrabold">
										Vendor 1 NameVendor 1 NameVendor 1 NameVendor 1 NameVendor 1
									</h4>
									<Form method="post" className="hover:text-primary ml-4">
										<Checkbox
											id="favorite"
											name="favorite"
											defaultChecked={false}
											className="sr-only"
											onCheckedChange={(checked) => {
												// Handle favorite toggle logic here
												console.log('Favorite toggled:', checked)
											}}
										/>
										<Label htmlFor="favorite" className="ml-2">
											<span className="sr-only">Favorite</span>
											<Icon name="heart" className="h-4 w-4" />
										</Label>
									</Form>
								</div>
							</div>
						</Link>
						<Link to="/vendors/2">
							<p>Vendor 2</p>
						</Link>
					</div>
				</div>
			</section>
		</>
	)
}
