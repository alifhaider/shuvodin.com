import { Form, useSearchParams } from 'react-router'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
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
import { prisma } from '#app/utils/db.server.ts'
import { LocationCombobox } from '../resources+/location-combobox'
import { VendorCombobox } from '../resources+/vendor-combobox'
import { type Route } from './+types/index.ts'
import {
	getFilterInputs,
	photographerFilterInputs,
} from '#app/utils/filters.ts'
import clsx from 'clsx'
import { Checkbox } from '#app/components/ui/checkbox.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Input } from '#app/components/ui/input.tsx'
import React from 'react'

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

		return (
			<>
				{filterInputs.map((option) => (
					<AccordionItem key={option.title} value={option.value}>
						<AccordionTrigger className="cursor-pointer text-lg font-bold">
							{option.title}
						</AccordionTrigger>
						<AccordionContent className="flex flex-col gap-4 px-2 text-balance">
							{option.inputs.map((input) => {
								const isChecked = searchParams.get(input.name) === 'true'
								const defaultValue = searchParams.get(input.name) || ''
								return (
									<React.Fragment key={input.name}>
										{input.type === 'checkbox' ? (
											<div className="flex items-start gap-3">
												<Checkbox
													id={input.name}
													defaultChecked={isChecked}
													onCheckedChange={(value) => {
														const newSearchParams = new URLSearchParams(
															searchParams,
														)
														if (value) {
															newSearchParams.set(input.name, 'true')
														} else {
															newSearchParams.delete(input.name)
														}
														setSearchParams(newSearchParams)
													}}
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
										) : input.type === 'text' || input.type === 'number' ? (
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
													onChange={(e) => {
														const newSearchParams = new URLSearchParams(
															searchParams,
														)
														console.log("here's the input:", input, e.target)
														if (e.target.value) {
															newSearchParams.set(input.name, e.target.value)
														} else {
															newSearchParams.delete(input.name)
														}
														setSearchParams(newSearchParams)
													}}
												/>
												{input.description ? (
													<p className="text-muted-foreground text-sm">
														{input.description}
													</p>
												) : null}
											</div>
										) : null}
									</React.Fragment>
								)
							})}
						</AccordionContent>
					</AccordionItem>
				))}
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
						{/* Filter Options */}

						<Accordion type="multiple" className="w-full">
							{renderFilters()}
						</Accordion>
					</Form>
				</div>
				<div className="flex flex-1 items-center justify-between border-b py-4">
					<p className="text-sm md:text-base">100+ Wedding Vendors Found</p>
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
