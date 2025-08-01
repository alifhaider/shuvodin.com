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

export const meta = {
	title: 'Vendors',
	description: 'Find the best wedding vendors in Bangladesh',
}

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
					<div className="max-w-4xl space-y-2">
						<h1 className="font-serif text-2xl font-bold capitalize md:text-4xl">
							The Best <span className="text-primary">{vendorType}</span>{' '}
							Vendors in {location}
						</h1>
						<p className="text-muted-foreground max-w-3xl text-xl">
							Discover the best wedding vendors in {location}. Explore top-rated
							vendors offering exceptional services. Find the perfect match for
							your needs and enjoy a seamless experience with our curated list
							of vendors.
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
				<div className="w-1/4">
					<Form
						method="get"
						onChange={(e) => {
							e.preventDefault()
							const formData = new FormData(e.currentTarget)
							// keep the existing search params
							const newSearchParams = new URLSearchParams(searchParams)
							// update the search params with the form data
							for (const [key, value] of formData.entries()) {
								if (typeof value === 'string' && value.trim() !== '') {
									newSearchParams.set(key, value)
								} else {
									newSearchParams.delete(key)
								}
							}
							setSearchParams(newSearchParams)
						}}
						className="space-y-4"
					>
						<h2 className="text-lg font-bold">Filter Options</h2>
						{/* Filter Options */}

						<Accordion type="single" collapsible className="w-full">
							<AccordionItem value="price">
								<AccordionTrigger className="text-lg font-bold">
									Price
								</AccordionTrigger>
								<AccordionContent className="flex flex-col gap-4 text-balance">
									<label className="text-sm font-medium" htmlFor="minPrice">
										Minimum Price
									</label>
									<input
										id="minPrice"
										type="number"
										name="minPrice"
										placeholder="0"
										className="border-border/50 h-10 w-full rounded-md border px-3"
									/>
									<label className="text-sm font-medium" htmlFor="maxPrice">
										Maximum Price
									</label>
									<input
										id="maxPrice"
										type="number"
										name="maxPrice"
										placeholder="10000"
										className="border-border/50 h-10 w-full rounded-md border px-3"
									/>
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value="location-fees">
								<AccordionTrigger className="text-lg font-bold">
									Location and Fees
								</AccordionTrigger>
								<AccordionContent className="flex flex-col gap-4 text-balance"></AccordionContent>
							</AccordionItem>
							<AccordionItem value="services">
								<AccordionTrigger className="text-lg font-bold">
									Services
								</AccordionTrigger>
								<AccordionContent className="flex flex-col gap-4 text-balance"></AccordionContent>
							</AccordionItem>
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
