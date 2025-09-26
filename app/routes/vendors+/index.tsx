import clsx from 'clsx'
import { format } from 'date-fns'
import { Img } from 'openimg/react'
import React from 'react'
import { Form, useSearchParams } from 'react-router'
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
import { getUserFavoriteVendorIds } from '#app/utils/auth.server.ts'
import { vendorTypes } from '#app/utils/constants.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getFilterInputs } from '#app/utils/filters.server.ts'
import { getVendorImgSrc, useDebounce } from '#app/utils/misc.tsx'
import { FavoriteVendorForm } from '../resources+/favorite-vendor-form.tsx'
import { LocationCombobox } from '../resources+/location-combobox'
import { VendorCombobox } from '../resources+/vendor-combobox'
import { type Route } from './+types/index.ts'

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
			division: true,
			district: true,
			address: true,
			isFeatured: true,
			rating: true,
			gallery: { take: 4, select: { objectKey: true, altText: true } },
			reviews: {
				take: 1,
				select: {
					user: { select: { name: true, username: true } },
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

	const favoritedVendorIds = await getUserFavoriteVendorIds(request)

	return { vendors, filterSchema, favoritedVendorIds, ok: true }
}

export default function VendorsPage({ loaderData }: Route.ComponentProps) {
	const $form = React.useRef<HTMLFormElement>(null)
	const [searchParams, setSearchParams] = useSearchParams()

	const vendor = vendorTypes.find(
		(vendor) => vendor.slug === searchParams.get('vendorType'),
	)
	const vendorType = vendor ? vendor.title : 'Wedding'
	const division = searchParams.get('division') || ''
	const district = searchParams.get('district') || ''
	const thana = searchParams.get('thana') || ''
	const location = division || district || thana || 'Bangladesh'

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

			// For capacity, use multi-value params
			const currentValues = newParams.getAll(filterCategory)

			if (value) {
				if (!currentValues.includes(filterName)) {
					newParams.append(filterCategory, filterName)
				}
			} else {
				const updated = currentValues.filter((v) => v !== filterName)
				newParams.delete(filterCategory)
				updated.forEach((v) => newParams.append(filterCategory, v))
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

	const checkFavorited = (vendorId: string) => {
		return loaderData.favoritedVendorIds.includes(vendorId)
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
											? isFilterChecked(option.value, input.name)
											: undefined
									return (
										<React.Fragment key={input.name}>
											{input.type === 'checkbox' ? (
												<div className="flex items-start gap-3">
													<Checkbox
														key={`${input.name}-${isChecked}`}
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
														key={input.name + defaultValue}
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
					<div className="border-muted divide-accent flex w-full flex-col items-center gap-4 divide-y rounded-2xl border bg-white px-6 py-4 lg:flex-row lg:divide-x lg:divide-y-0 lg:rounded-full dark:bg-gray-800">
						<div className="flex w-full items-center gap-3 lg:flex-1">
							<label
								htmlFor="search"
								className="px-4 py-2 text-sm font-medium whitespace-nowrap"
							>
								<span className="sr-only">Search</span>
								<Icon name="square-pen" className="h-5 w-5" />
							</label>

							<input
								type="text"
								key={searchParams.get('search') || ''}
								defaultValue={searchParams.get('search') || ''}
								name="search"
								id="search"
								onChange={(e) =>
									handleInputChange('search', e.currentTarget.value)
								}
								placeholder="Name"
								className="text-secondary-foreground max-w-md flex-1 text-lg font-medium backdrop-blur outline-none placeholder:font-normal md:text-xl"
							/>
						</div>
						<LocationCombobox />
						<VendorCombobox />
					</div>
				</div>
			</section>
			<section className="container flex items-start gap-6">
				<div className={clsx('w-1/4', vendor ? 'hidden lg:block' : 'hidden')}>
					<Form method="get" className="space-y-4" ref={$form} reloadDocument>
						<Accordion type="multiple" className="w-full">
							{renderFilters()}
						</Accordion>
					</Form>
				</div>
				<div className="flex-1">
					<div className="border-secondary flex w-full items-start justify-between border-b py-4">
						<div className="space-y-2">
							<p className="text-sm md:text-base">
								100+ Wedding <strong>{vendor?.title ?? 'Vendors'} </strong>{' '}
								Found in <strong> {location ? location : 'Bangladesh'}</strong>
							</p>

							<FilterChips />
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm md:text-base">Sort by:</span>
							<Form method="get" className="w-40">
								<Select
									name="sortOrder"
									value={searchParams.get('sortOrder') || 'relevance'}
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
								className="group flex flex-col gap-4 py-4 md:gap-6 lg:flex-row"
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
									<div className="flex items-center justify-between">
										<h4 className="line-clamp-1 text-xl font-extrabold group-hover:underline">
											{vendor.businessName}
										</h4>

										<FavoriteVendorForm
											vendorId={vendor.id}
											isFavorited={checkFavorited(vendor.id)}
										/>
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
											{vendor.address}- {vendor?.district}
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
