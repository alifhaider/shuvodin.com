import { Link } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { LocationCombobox } from '../resources+/location-combobox'
import { VendorCombobox } from '../resources+/vendor-combobox'
import { type Route } from './+types/$vendorId'

export async function loader({ params }: Route.LoaderArgs) {
	const { vendorId } = params
	// Here you can fetch data based on the vendorId if needed
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId },
		select: { category: true },
	})
	return { vendor }
}

export default function VendorsPage({ loaderData }: Route.ComponentProps) {
	const categoryName = loaderData.vendor?.category.name
	return (
		<section className="from-primary/10 via-accent/5 to-secondary/10 bg-gradient-to-r py-12">
			<div className="container space-y-6">
				<div className="space-y-2">
					<div className="text-muted-foreground flex items-center gap-2 text-sm">
						<Link to="/" className="hover:text-primary">
							Home
						</Link>
						<span>/</span>
						<Link to="/vendors" className="hover:text-primary">
							Vendors
						</Link>
						<span>/</span>
						<span className="text-foreground">{categoryName}</span>
					</div>
					<h1 className="font-serif text-4xl font-bold lg:text-5xl">
						Find <span className="text-primary">{categoryName}</span>
					</h1>
				</div>

				{/* Search Bar */}
				<div className="flex max-w-4xl flex-col gap-4 lg:flex-row">
					<div className="relative flex-1">
						<Icon
							name="magnifying-glass"
							className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform"
						/>
						<Input
							placeholder={`Search ${categoryName?.toLowerCase()}...`}
							className="border-border/50 h-12 bg-white pl-12"
						/>

						<LocationCombobox />
						<VendorCombobox />
					</div>
					<Button size="lg" className="h-12 px-8">
						<Icon name="magnifying-glass" className="mr-2 h-4 w-4" />
						Search
					</Button>
				</div>
			</div>
		</section>
	)
}
