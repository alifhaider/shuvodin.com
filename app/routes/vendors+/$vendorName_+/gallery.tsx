import Breadcrumb from '#app/components/breadcrumb.tsx'
import { type Route } from './+types/gallery'

export const meta: Route.MetaFunction = ({ data }) => {
	return [
		{
			title: `Gallery / ${data?.vendor.name}`,
			description: `Explore the gallery for ${data?.vendor.name}.`,
		},
	]
}

export async function loader({ params }: Route.LoaderArgs) {
	const { vendorName } = params

	const mockVendorImageResponse = {
		vendorName,
		name: 'Sample Vendor',
		type: 'photography',
		images: [
			{ src: '/img/gallery1.jpg', alt: 'Gallery Image 1' },
			{ src: '/img/gallery2.jpg', alt: 'Gallery Image 2' },
			{ src: '/img/gallery3.jpg', alt: 'Gallery Image 3' },
			{ src: '/img/gallery4.jpg', alt: 'Gallery Image 4' },
			{ src: '/img/gallery5.jpg', alt: 'Gallery Image 5' },
		],
	}

	// Here you can fetch data based on the vendorName if needed
	// For now, we will return the vendorName directly
	return { vendor: mockVendorImageResponse }
}

export default function GalleryPage({ loaderData }: Route.ComponentProps) {
	const { vendor } = loaderData
	return (
		<>
			<section className="container py-12">
				<Breadcrumb
					items={[
						{ to: '/', label: 'Home' },
						{ to: '/vendors', label: 'Vendors' },
						{ to: `/vendors?vendorType=${vendor.type}`, label: vendor.type },
						{ to: `/vendors/${vendor.vendorName}`, label: vendor.name },
						{
							to: `/vendors/${vendor.vendorName}/gallery`,
							label: 'Gallery',
							isCurrent: true,
						},
					]}
				/>
			</section>
			<section className="container"></section>
		</>
	)
}
