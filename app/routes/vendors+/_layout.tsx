import { Link, Outlet, useLocation } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/_layout'

const navigationItems = [
	{
		title: 'General',
		href: '/vendors/onboarding/general',
		icon: 'user',
		description: 'Update your Vendor details',
	},
	{
		title: 'Gallery',
		href: '/vendors/onboarding/gallery',
		icon: 'image',
		description: 'Manage your vendor images',
	},
	{
		title: 'Services and Amenities',
		href: '/vendors/onboarding/services',
		icon: 'settings',
		description: 'Set up your services and amenities',
	},
	{
		title: 'Links and Others',
		href: '/vendors/onboarding/links',
		icon: 'link',
		description: 'Add your social and other information',
	},
]

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	return {}
}

export default function OnboardingVendorLayout() {
	const { pathname } = useLocation()
	return (
		<div className="container py-12">
			<h1 className="text-foreground text-3xl font-bold">
				Welcome to Vendor Onboarding
			</h1>

			<p className="text-muted-foreground mt-2 text-sm md:text-base">
				Add and manage your vendor profile details.
			</p>

			<div className="mt-10 grid grid-cols-1 gap-10 sm:gap-20 lg:grid-cols-4">
				<nav className="flex flex-col gap-6 lg:col-span-1">
					{navigationItems.map((navigationItem) => {
						const isActive = pathname.includes(navigationItem.href)

						return (
							<Link
								key={navigationItem.href}
								to={navigationItem.href}
								className={`hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-2 text-sm transition-colors ${
									isActive
										? 'bg-accent text-accent-foreground'
										: 'text-muted-foreground'
								}`}
							>
								<h3 className="text-secondary-foreground text-sm font-bold md:text-base">
									{navigationItem.title}
								</h3>
								<p className="text-muted-foreground text-xs md:text-sm">
									{navigationItem.description}
								</p>
							</Link>
						)
					})}
				</nav>
				<section className="lg:col-span-3">
					<Outlet />
				</section>
			</div>
		</div>
	)
}
