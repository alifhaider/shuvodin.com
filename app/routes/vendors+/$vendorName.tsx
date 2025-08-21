import { invariantResponse } from '@epic-web/invariant'
import clsx from 'clsx'
import { Img } from 'openimg/react'
import { Link } from 'react-router'
import Breadcrumb from '#app/components/breadcrumb.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Separator } from '#app/components/ui/separator.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getVendorImgSrc } from '#app/utils/misc.tsx'
import { type Route } from './+types/$vendorName'

export const meta: Route.MetaFunction = ({ data }) => {
	return [
		{
			title: data?.vendor?.businessName
				? `${data?.vendor.businessName} / ShuvoDin`
				: 'Vendor / ShuvoDin',
		},
	]
}

export async function loader({ params }: Route.LoaderArgs) {
	const { vendorName } = params
	const vendor = await prisma.vendor.findUnique({
		where: { slug: vendorName },
		include: {
			vendorType: {
				select: {
					slug: true,
					name: true,
				},
			},
			gallery: {
				take: 4,
				select: {
					objectKey: true,
					altText: true,
				},
			},
			owner: {
				select: {
					name: true,
					image: {
						select: {
							objectKey: true,
							altText: true,
						},
					},
				},
			},
			venueDetails: {
				select: {
					spaces: {
						select: {
							id: true,
							name: true,
							sittingCapacity: true,
							standingCapacity: true,
							price: true,
							description: true,
							image: {
								select: {
									objectKey: true,
									altText: true,
								},
							},
						},
					},
				},
			},
			packages: {
				select: {
					title: true,
					description: true,
					price: true,
				},
			},
			_count: {
				select: {
					favorites: true,
					gallery: true,
					bookings: true,
					reviews: true,
				},
			},
			reviews: {
				select: { rating: true, comment: true },
				take: 5,
				orderBy: { createdAt: 'desc' },
			},

			location: {
				select: {
					city: true,
					address: true,
				},
			},
		},
	})

	invariantResponse(vendor, 'Vendor not found', { status: 404 })

	return { vendor }
}

export default function VendorsPage({ loaderData }: Route.ComponentProps) {
	const { vendor } = loaderData
	return (
		<>
			<section className="from-primary/10 via-accent/5 to-secondary/10 bg-gradient-to-r py-12">
				<div className="container py-6">
					<Breadcrumb
						items={[
							{ to: '/', label: 'Home' },
							{ to: '/vendors', label: 'Vendors' },
							{
								to: `/vendors?vendorType=${vendor.vendorType.slug}`,
								label: vendor.vendorType.name,
							},
							{
								to: `/vendors/${vendor.slug}`,
								label: vendor.businessName,
								isCurrent: true,
							},
						]}
					/>
					<Gallery gallery={vendor.gallery} uniqueName={vendor.slug} />
					<div className="mt-6 flex gap-12">
						<div className="flex-1">
							<h1 className="font-serif text-4xl font-bold lg:text-5xl">
								{vendor.businessName}
							</h1>

							<p className="mt-4 flex items-center gap-2 text-base font-semibold">
								<Icon name="map-pin" className="inline h-4 w-4" />
								{vendor.location?.address}, {vendor.location?.city}
							</p>

							<div className="mt-3 flex items-end gap-[1px]">
								{Array.from({ length: 5 }, (_, index) => (
									<Icon
										key={index}
										name="star"
										className={clsx(
											'h-6 w-6',
											index < vendor.rating
												? 'fill-yellow-500 text-yellow-500'
												: 'text-gray-300',
										)}
									/>
								))}
								<span className="ml-1 text-xl font-bold">
									{vendor.rating.toFixed(1)}
								</span>
								<span className="text-muted-foreground mb-0.5 ml-1 text-sm">
									{' '}
									({vendor._count.reviews} reviews)
								</span>
							</div>

							<Separator className="my-6" />

							<h5 className="mb-2 text-lg font-medium md:mb-3 md:text-2xl">
								About this{' '}
								<span className="font-extrabold">{vendor.vendorType.name}</span>
							</h5>

							<p className="text-muted-foreground max-w-full text-base md:max-w-2xl md:text-lg">
								{vendor.description}
							</p>
						</div>

						<div className="border-accent sticky mt-6 h-max w-1/4 rounded-2xl border p-6 shadow-sm">
							<h4 className="text-2xl font-extrabold">
								Want them for your wedding?
							</h4>

							<div className="mt-4 flex items-center gap-4 font-medium">
								<Button className="h-14 w-full rounded-full text-xl">
									Get Quote
								</Button>

								<button className="border-primary text-primary hover:text-secondary-foreground hover:bg-accent flex aspect-square h-14 cursor-pointer items-center justify-center rounded-full border p-2">
									<Icon name="share" className="h-5 w-5" />
									<span className="sr-only">Share</span>
								</button>

								<button className="border-primary group text-primary hover:text-primary-foreground flex aspect-square h-14 cursor-pointer items-center justify-center rounded-full border p-2 hover:bg-red-400">
									<Icon name="heart" fill="red" className="h-5 w-5" />
									<span className="sr-only">Favorite</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>
			<section className="container py-12">
				{vendor.vendorType.name === 'venues' ? (
					<VenueDetails venue={vendor.venueDetails} />
				) : null}
			</section>
		</>
	)
}

const Gallery = ({
	gallery,
	uniqueName,
}: {
	gallery: { objectKey: string; altText: string | null }[]
	uniqueName: string
}) => {
	if (!gallery || gallery.length === 0) {
		return <p>No images available</p>
	}
	const slicedImages = gallery.slice(0, 4)
	const hasMoreImages = gallery.length > 4
	if (slicedImages.length === 0) return <p>No images available</p>
	return (
		<Link
			to={`/vendors/${uniqueName}/gallery`}
			className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-[55%_20%_25%] md:grid-rows-2"
		>
			{slicedImages.map((image, index) => (
				<div
					className={clsx('relative h-full w-full rounded-lg object-cover', {
						'row-span-2 max-h-96': index === 0 || index === 2,
						'max-h-46': index === 1 || index === 3,
					})}
					key={index}
				>
					<Img
						loading="lazy"
						placeholder="blur"
						height={index === 0 || index === 2 ? 400 : 200}
						width={index === 0 || index === 2 ? 600 : 300}
						src={getVendorImgSrc(image.objectKey)}
						alt={image.altText || `${uniqueName} Gallery Image ${index + 1}`}
						className="h-full w-full rounded-lg object-cover"
					/>
					{hasMoreImages && index === 2 && (
						<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 px-2 py-1 text-white">
							<span className="rounded-lg bg-black/50 px-4 py-2">
								View All{' '}
								<span className="text-sm">({gallery.length - 4} More)</span>
							</span>
						</div>
					)}
				</div>
			))}
		</Link>
	)
}

type VenueDetailsProps = {
	venue: Route.ComponentProps['loaderData']['vendor']['venueDetails']
}

const VenueDetails = ({ venue }: VenueDetailsProps) => {
	console.log('Venue Details:', venue)
	return (
		<>
			<h4 className="text-lg font-medium md:text-2xl">Event Spaces</h4>
			{venue?.spaces.map((space) => {
				return (
					<div key={space.id} className="mb-4">
						<h5 className="text-md font-semibold">{space.name}</h5>
						<p className="text-muted-foreground text-sm">
							Sitting Capacity: {space.sittingCapacity}
						</p>
						<p className="text-muted-foreground text-sm">
							Standing Capacity: {space.standingCapacity}
						</p>
						<p className="text-muted-foreground text-sm">
							Price: {space.price}
						</p>
						<p className="text-muted-foreground text-sm">
							Description: {space.description}
						</p>
					</div>
				)
			})}
		</>
	)
}
