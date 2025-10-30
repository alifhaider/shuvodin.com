import Breadcrumb from '#app/components/breadcrumb.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { Route } from './+types/edit'

export async function loader({ params, request }: Route.LoaderArgs) {
	await requireUserId(request)
	const vendor = await prisma.vendor.findUniqueOrThrow({
		where: { slug: params.vendorName! },
		select: {
			slug: true,
			businessName: true,
		},
	})

	return { vendor }
}

export default function EditVendorPage({ loaderData }: Route.ComponentProps) {
	return (
		<section className="from-primary/10 via-accent/5 to-secondary/10 relative bg-gradient-to-r py-6">
			<div className="container">
				<Breadcrumb
					items={[
						{ to: '/', label: 'Home' },
						{ to: '/vendors', label: 'Vendors' },
						{
							to: `/vendors/${loaderData.vendor.slug}`,
							label: loaderData.vendor.businessName,
						},
						{
							to: `/vendors/${loaderData.vendor.slug}/edit`,
							label: `${loaderData.vendor.businessName} Edit`,
							isCurrent: true,
						},
					]}
				/>
			</div>
		</section>
	)
}
