import clsx from 'clsx'
import { Image, Img } from 'openimg/react'
import React from 'react'
import { Form, Link, useSearchParams } from 'react-router'
import Breadcrumb from '#app/components/breadcrumb.tsx'
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
import { getVendorImgSrc, useDebounce } from '#app/utils/misc.tsx'
import { LocationCombobox } from '../resources+/location-combobox'
import { VendorCombobox } from '../resources+/vendor-combobox'
import { type Route } from './+types/index.ts'
import { prisma } from '#app/utils/db.server.ts'
import { format } from 'date-fns'

// TODO: clearing filter chips not updating form inputs

export const meta: Route.MetaFunction = () => {
	return [{ title: 'Vendors / ShuvoDin' }]
}

export async function loader({ request }: Route.LoaderArgs) {
	const vendors = await prisma.vendor.findMany({
		select: {
			id: true,
			businessName: true,
			slug: true,
			description: true,
			location: {
				select: {
					city: true,
					address: true,
				},
			},
			isFeatured: true,
			rating: true,
			gallery: {
				take: 4,
				select: {
					objectKey: true,
					altText: true,
				},
			},
			reviews: {
				take: 1,
				select: {
					user: {
						select: {
							name: true,
							username: true,
						},
					},
					createdAt: true,
					comment: true,
				},
			},
		},
	})

	const searchParams = new URL(request.url).searchParams
	const vendorType = searchParams.get('vendorType') ?? ''
	// const city = searchParams.get('city') ?? ''
	// const address = searchParams.get('address') ?? ''
	// const minPrice = searchParams.get('minPrice') ?? ''
	// const maxPrice = searchParams.get('maxPrice') ?? ''
	// const sortOrder = searchParams.get('sortOrder') ?? 'relevance'

	const filterSchema = getFilterInputs(vendorType)

	// const vendors = await prisma.$queryRawTyped(
	// 	getVendors(vendorType, city, address, minPrice, maxPrice, sortOrder),
	// )

	return { vendors, filterSchema, ok: true }
}

export default function VendorsPage({ loaderData }: Route.ComponentProps) {
	const $capacityRanges = React.useRef<Record<string, boolean>>({})
	const $form = React.useRef<HTMLFormElement>(null)
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
		{ label: 'Vendors', to: '/vendors', isCurrent: Boolean(!vendor?.slug) },
		{
			label: vendor?.title,
			to: `/vendors?vendorType=${vendor?.slug}`,
			isCurrent: Boolean(vendor?.slug),
		},
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
				$capacityRanges.current[filterName] = value as boolean

				const checkedRanges = Object.entries($capacityRanges.current)
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

	const handleSortChange = (value: string) => {
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev)
			if (value === 'relevance') {
				newParams.delete('sortOrder')
			} else {
				newParams.set('sortOrder', value)
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
														checked={isChecked}
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
														value={defaultValue}
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

	const selectedFilters: Record<string, string> = {}
	searchParams.forEach((value, key) => {
		if (key !== 'vendorType' && key !== 'city' && key !== 'address') {
			selectedFilters[key] = value
		}
	})

	console.log('Selected Filters:', selectedFilters)

	return (
		<>
			<section className="from-primary/10 via-accent/5 to-secondary/10 border-secondary border-b bg-gradient-to-r py-12">
				<div className="container space-y-6">
					<Breadcrumb items={breadcrumbs} />
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
					<Form method="get" className="space-y-4" ref={$form} reloadDocument>
						<Accordion type="multiple" className="w-full">
							{renderFilters()}
						</Accordion>
					</Form>
				</div>
				<div className="flex-1">
					<div className="border-secondary flex w-full items-start justify-between border-b py-4">
						<div className="space-y-2">
							<p className="text-sm md:text-base">100+ Wedding Vendors Found</p>

							<FilterChips $capacityRanges={$capacityRanges} $form={$form} />
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm md:text-base">Sort by:</span>
							<Form method="get" className="w-40">
								<Select
									name="sortOrder"
									defaultValue={searchParams.get('sortOrder') || 'relevance'}
									onValueChange={handleSortChange}
								>
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
							</Form>
						</div>
					</div>

					<div className="divide-accent-foreground/10 divide-y">
						{loaderData.vendors.map((vendor) => (
							<a
								key={vendor.id}
								href={`/vendors/${vendor.slug}`}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex gap-4 py-4 md:gap-6"
							>
								<div className="relative h-60 min-w-103">
									<Img
										src={getVendorImgSrc(vendor.gallery[0]?.objectKey)}
										alt={`Vendor ${vendor.id}`}
										width={412}
										height={240}
										className="h-60 w-full rounded-lg object-cover"
									/>

									{vendor.isFeatured && (
										<div className="text-primary absolute top-2 left-2 rounded-md bg-gray-700/60 px-2 py-1 text-xs font-bold">
											Featured
										</div>
									)}
								</div>
								<div className="w-full space-y-2">
									<div className="flex items-center">
										<h4 className="line-clamp-1 text-xl font-extrabold group-hover:underline">
											{vendor.businessName}
										</h4>

										<Form
											method="post"
											className="hover:text-primary ml-4 flex items-center"
										>
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
									<div className="flex items-center">
										{Array.from({ length: 5 }, (_, index) => (
											<Icon
												key={index}
												name="star"
												className={clsx(
													'h-3.5 w-3.5',
													index < vendor.rating
														? 'fill-yellow-500 text-yellow-500'
														: 'text-gray-300',
												)}
											/>
										))}
										<span className="ml-1 text-base">{vendor.rating}</span>

										<span className="ml-3 text-sm font-medium">
											<Icon name="map-pin" className="h-4 w-4" />
											{vendor.location?.city}- {vendor?.location?.address}
										</span>
									</div>

									<div className="flex items-center gap-4 font-bold">
										<div className="flex items-center gap-1">
											<Icon name="coins" className="h-4 w-4" />
											<span className="text-sm">Starts at 20000 tk</span>
										</div>
										<div className="flex items-center gap-1">
											<Icon name="users" className="h-4 w-4" />
											<span className="text-sm">3000 Guests</span>
										</div>
									</div>

									<div className="max-h-20 max-w-md overflow-y-auto mask-b-from-5% [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
										<p className="text-secondary-foreground pb-10 text-sm">
											{vendor.description}
										</p>
									</div>
									{vendor.reviews.length > 0 && (
										<div className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm">
											<p>
												{vendor.reviews[0]?.comment}
												{vendor.reviews[0] &&
													vendor.reviews[0]?.comment &&
													vendor.reviews[0]?.comment?.length > 100 &&
													'...'}
												{/* Show "Read More" button if content is truncated */}
												{vendor.reviews[0] &&
													vendor.reviews[0]?.comment &&
													vendor.reviews[0]?.comment?.length > 100 && (
														<button className="text-primary ml-4 font-semibold">
															Read More
														</button>
													)}
											</p>

											<span className="text-muted-foreground text-xs font-medium">
												Reviewed by{' '}
												<strong>
													{vendor.reviews[0]?.user.name ??
														vendor.reviews[0]?.user.username}{' '}
												</strong>
												on{' '}
												{vendor.reviews[0]?.createdAt ? (
													<strong>
														{format(
															vendor.reviews[0]?.createdAt,
															'MMM dd, yyyy',
														)}
													</strong>
												) : null}
											</span>
										</div>
									)}
								</div>
							</a>
						))}
					</div>
				</div>
			</section>
		</>
	)
}
