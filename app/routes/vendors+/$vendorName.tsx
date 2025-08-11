import Breadcrumb from '#app/components/breadcrumb.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { cn } from '#app/utils/misc.tsx'
import clsx from 'clsx'
import { LocationCombobox } from '../resources+/location-combobox'
import { VendorCombobox } from '../resources+/vendor-combobox'
import { type Route } from './+types/$vendorName'
import { Link } from 'react-router'

export const meta: Route.MetaFunction = ({ data }) => {
	return [
		{
			title: data?.vendor.name
				? `${data?.vendor.name} / ShuvoDin`
				: 'Vendor / ShuvoDin',
		},
	]
}

export async function loader({ params }: Route.LoaderArgs) {
	const mockVendorDetails = {
		id: '123',
		name: 'Sample Vendor',
		uniqueName: 'sample-vendor',
		description: 'This is a sample vendor description.',
		vendorType: 'photography',
		avgRating: 4.5,
		totalReviews: 120,
		images: [
			{ src: '/img/placeholder.png', alt: 'Sample Image' },
			{ src: '/img/placeholder.png', alt: 'Another Sample Image' },
			{ src: '/img/placeholder.png', alt: 'Third Sample Image' },
			{ src: '/img/placeholder.png', alt: 'Fourth Sample Image' },
			{ src: '/img/placeholder.png', alt: 'Fifth Sample Image' },
		],
		city: 'Dhaka',
		address: '123 Sample Street',
		// Add other necessary fields as needed
	}
	// const { vendorId } = params
	// // Here you can fetch data based on the vendorId if needed
	// const vendor = await prisma.vendor.findUnique({
	// 	where: { id: vendorId },
	// })
	return { vendor: mockVendorDetails }
}

export default function VendorsPage({ loaderData }: Route.ComponentProps) {
	const { vendor } = loaderData
	return (
		<section className="from-primary/10 via-accent/5 to-secondary/10 bg-gradient-to-r py-12">
			<div className="container">
				<Breadcrumb
					items={[
						{ to: '/', label: 'Home' },
						{ to: '/vendors', label: 'Vendors' },
						{
							to: `/vendors?vendorType=${vendor.vendorType}`,
							label: vendor.vendorType,
						},
						{
							to: `/vendors/${vendor.id}`,
							label: vendor.name,
							isCurrent: true,
						},
					]}
				/>
				<Gallery images={vendor.images} uniqueName={vendor.uniqueName} />
				<h1 className="mt-6 font-serif text-4xl font-bold lg:text-5xl">
					{vendor.name}
				</h1>

				<p className="mt-4 flex items-center gap-2 text-base font-semibold">
					<Icon name="map-pin" className="inline h-4 w-4" />
					{vendor.address}, {vendor.city}
				</p>

				<div className="flex items-center gap-0.5">
					{Array.from({ length: 5 }, (_, index) => (
						<Icon
							key={index}
							name="star"
							className={clsx(
								'h-4 w-4',
								index < vendor.avgRating
									? 'fill-yellow-500 text-yellow-500'
									: 'text-gray-300',
							)}
						/>
					))}
					<span className="ml-1 text-base font-medium">
						{vendor.avgRating.toFixed(1)}
					</span>
					<span className="text-muted-foreground ml-1 text-sm">
						{' '}
						({vendor.totalReviews} reviews)
					</span>
				</div>
			</div>
		</section>
	)
}

const Gallery = ({
	images,
	uniqueName,
}: {
	images: { src: string; alt: string }[]
	uniqueName: string
}) => {
	if (!images || images.length === 0) {
		return <p>No images available</p>
	}
	const slicedImages = images.slice(0, 4)
	const hasMoreImages = images.length > 4
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
					<img
						src={image.src}
						alt={image.alt}
						className="h-full w-full rounded-lg object-cover"
					/>
					{hasMoreImages && index === 2 && (
						<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 px-2 py-1 text-white">
							<span className="rounded-lg bg-black/50 px-4 py-2">
								View All{' '}
								<span className="text-sm">({images.length - 4} More)</span>
							</span>
						</div>
					)}
				</div>
			))}
		</Link>
	)
}
