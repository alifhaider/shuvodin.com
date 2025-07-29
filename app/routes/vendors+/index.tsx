import { Input } from '#app/components/ui/input.tsx'
import { Outlet } from 'react-router'
import { LocationCombobox } from '../resources+/location-combobox'
import { VendorCombobox } from '../resources+/vendor-combobox'

export default function VendorsPage() {
	return (
		<>
			<section className="from-primary/10 via-accent/5 to-secondary/10 border-b bg-gradient-to-r py-12">
				<div className="container space-y-6">
					<div className="space-y-2">
						<h1 className="font-serif text-4xl font-bold lg:text-5xl">
							The Best Wedding Vendors
						</h1>
						<p className="text-muted-foreground max-w-3xl text-xl">
							Discover the best wedding vendors in Bangladesh. Explore top-rated
							vendors offering exceptional services. Find the perfect match for
							your needs and enjoy a seamless experience with our curated list
							of vendors.
						</p>
					</div>

					{/* Search Bar */}
					<div className="flex max-w-4xl flex-col gap-4 lg:flex-row">
						<LocationCombobox />
						<VendorCombobox />
					</div>
				</div>
			</section>
			<Outlet />
		</>
	)
}
