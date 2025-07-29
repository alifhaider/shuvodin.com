import { Link } from 'react-router'
import { Route } from './+types/$slug'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Button } from '#app/components/ui/button.tsx'

export default function CategoriesPage({ params }: Route.ComponentProps) {
	const categoryName = params.slug
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase())
	return (
		<>
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
						<p className="text-muted-foreground max-w-3xl text-xl">
							Discover the best {categoryName.toLowerCase()} in Bangladesh.
							Explore top-rated vendors offering exceptional services in{' '}
							{categoryName.toLowerCase()}. Find the perfect match for your
							needs and enjoy a seamless experience with our curated list of
						</p>
					</div>

					{/* Search Bar */}
					<div className="flex max-w-4xl flex-col gap-4 lg:flex-row">
						<div className="relative flex-1">
							<Icon
								name="magnifying-glass"
								className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform"
							/>
							<Input
								placeholder={`Search ${categoryName.toLowerCase()}...`}
								className="border-border/50 h-12 bg-white pl-12"
							/>
						</div>
						<Button size="lg" className="h-12 px-8">
							<Icon name="magnifying-glass" className="mr-2 h-4 w-4" />
							Search
						</Button>
					</div>
				</div>
			</section>
		</>
	)
}
