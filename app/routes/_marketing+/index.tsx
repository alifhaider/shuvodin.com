import * as React from 'react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '#app/components/ui/command.tsx'
import { Icon, IconName } from '#app/components/ui/icon.tsx'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover.tsx'
import { cn } from '#app/utils/misc.tsx'
import { type Route } from './+types/index.ts'
import { logos } from './logos/logos.ts'
import { prisma } from '#app/utils/db.server.ts'
import { Image } from 'openimg/react'
import { Input } from '#app/components/ui/input.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'

export const meta: Route.MetaFunction = () => [{ title: 'Epic Notes' }]

const stats = [
	{ number: '10,000+', label: 'Happy Couples', icon: 'heart' },
	{ number: '1,500+', label: 'Verified Vendors', icon: 'shield' },
	{ number: '50+', label: 'Cities Covered', icon: 'map-pin' },
	{ number: '98%', label: 'Satisfaction Rate', icon: 'star' },
]

const serviceCategories = [
	{
		icon: 'camera',
		title: 'Photography',
		description: 'Capture your precious moments',
		count: '250+ vendors',
		color: 'bg-blue-50 text-blue-600',
	},
	{
		icon: 'building-2',
		title: 'Venues',
		description: 'Perfect locations for your day',
		count: '180+ venues',
		color: 'bg-purple-50 text-purple-600',
	},
	{
		icon: 'utensils',
		title: 'Catering',
		description: 'Delicious culinary experiences',
		count: '320+ caterers',
		color: 'bg-green-50 text-green-600',
	},
	{
		icon: 'palette',
		title: 'Decoration',
		description: 'Transform spaces beautifully',
		count: '190+ decorators',
		color: 'bg-pink-50 text-pink-600',
	},
	{
		icon: 'users',
		title: 'Event Planning',
		description: 'Complete event management',
		count: '120+ planners',
		color: 'bg-orange-50 text-orange-600',
	},
	{
		icon: 'music',
		title: 'Entertainment',
		description: 'Music and entertainment',
		count: '85+ artists',
		color: 'bg-indigo-50 text-indigo-600',
	},
	{
		icon: 'car',
		title: 'Transportation',
		description: 'Luxury wedding transport',
		count: '95+ services',
		color: 'bg-red-50 text-red-600',
	},
	{
		icon: 'flower-2',
		title: 'Floristry',
		description: 'Beautiful floral arrangements',
		count: '110+ florists',
		color: 'bg-emerald-50 text-emerald-600',
	},
	{
		icon: 'cake',
		title: 'Wedding Cakes',
		description: 'Custom designed cakes',
		count: '75+ bakers',
		color: 'bg-yellow-50 text-yellow-600',
	},
	{
		icon: 'shirt',
		title: 'Bridal Wear',
		description: 'Stunning wedding attire',
		count: '140+ designers',
		color: 'bg-teal-50 text-teal-600',
	},
]

const venueStyles = [
	{
		title: 'Convention Halls',
		description: 'Grand spaces for large celebrations',
		count: '120+ venues',
		image: '/placeholder.svg?height=250&width=400&text=Convention+Hall',
		priceRange: '৳80,000 - ৳300,000',
	},
	{
		title: 'Restaurants',
		description: 'Intimate dining experiences',
		count: '200+ venues',
		image: '/placeholder.svg?height=250&width=400&text=Restaurant',
		priceRange: '৳30,000 - ৳150,000',
	},
	{
		title: 'Community Centers',
		description: 'Affordable community spaces',
		count: '85+ venues',
		image: '/placeholder.svg?height=250&width=400&text=Community+Center',
		priceRange: '৳15,000 - ৳60,000',
	},
	{
		title: 'Outdoor Gardens',
		description: 'Beautiful natural settings',
		count: '65+ venues',
		image: '/placeholder.svg?height=250&width=400&text=Garden+Venue',
		priceRange: '৳40,000 - ৳200,000',
	},
	{
		title: 'Rooftop Venues',
		description: 'Sky-high celebrations',
		count: '45+ venues',
		image: '/placeholder.svg?height=250&width=400&text=Rooftop+Venue',
		priceRange: '৳50,000 - ৳250,000',
	},
	{
		title: 'Heritage Venues',
		description: 'Historic and cultural spaces',
		count: '25+ venues',
		image: '/placeholder.svg?height=250&width=400&text=Heritage+Venue',
		priceRange: '৳100,000 - ৳500,000',
	},
]

const featuredVendors = [
	{
		name: 'Royal Moments Photography',
		category: 'Photography',
		location: 'Gulshan, Dhaka',
		rating: 4.9,
		reviews: 247,
		price: '৳35,000',
		image: '/placeholder.svg?height=300&width=400&text=Royal+Moments',
		badge: 'Premium',
		verified: true,
	},
	{
		name: 'Golden Palace Convention',
		category: 'Venue',
		location: 'Dhanmondi, Dhaka',
		rating: 4.8,
		reviews: 189,
		price: '৳180,000',
		image: '/placeholder.svg?height=300&width=400&text=Golden+Palace',
		badge: 'Popular',
		verified: true,
	},
	{
		name: 'Spice Garden Catering',
		category: 'Catering',
		location: 'Uttara, Dhaka',
		rating: 4.7,
		reviews: 312,
		price: '৳1,200/person',
		image: '/placeholder.svg?height=300&width=400&text=Spice+Garden',
		badge: 'Top Rated',
		verified: true,
	},
	{
		name: 'Elegant Decorations',
		category: 'Decoration',
		location: 'Banani, Dhaka',
		rating: 4.9,
		reviews: 156,
		price: '৳45,000',
		image: '/placeholder.svg?height=300&width=400&text=Elegant+Decorations',
		badge: 'Premium',
		verified: true,
	},
]

const testimonials = [
	{
		name: 'Fatima Rahman',
		location: 'Dhaka',
		text: 'ShuvoDin made our wedding planning so much easier. We found amazing vendors and saved both time and money!',
		rating: 5,
		image: '/placeholder.svg?height=60&width=60&text=FR',
	},
	{
		name: 'Ahmed Hassan',
		location: 'Chittagong',
		text: 'The quality of vendors on ShuvoDin is exceptional. Our photographer was absolutely perfect for our special day.',
		rating: 5,
		image: '/placeholder.svg?height=60&width=60&text=AH',
	},
	{
		name: 'Rashida Begum',
		location: 'Sylhet',
		text: 'From venue to catering, everything was seamlessly coordinated through ShuvoDin. Highly recommended!',
		rating: 5,
		image: '/placeholder.svg?height=60&width=60&text=RB',
	},
]

const popularLocations = [
	{
		name: 'Dhaka',
		venues: 450,
		image: '/placeholder.svg?height=200&width=300&text=Dhaka',
	},
	{
		name: 'Chittagong',
		venues: 280,
		image: '/placeholder.svg?height=200&width=300&text=Chittagong',
	},
	{
		name: 'Sylhet',
		venues: 180,
		image: '/placeholder.svg?height=200&width=300&text=Sylhet',
	},
	{
		name: 'Rajshahi',
		venues: 150,
		image: '/placeholder.svg?height=200&width=300&text=Rajshahi',
	},
	{
		name: 'Khulna',
		venues: 120,
		image: '/placeholder.svg?height=200&width=300&text=Khulna',
	},
	{
		name: 'Barisal',
		venues: 95,
		image: '/placeholder.svg?height=200&width=300&text=Barisal',
	},
]

export async function loader() {
	const vendorCategories = await prisma.vendorCategory.findMany({
		select: {
			name: true,
			id: true,
		},
		orderBy: {
			name: 'asc',
		},
	})
	return { vendorCategories }
}

export default function Index({ loaderData }: Route.ComponentProps) {
	const { vendorCategories } = loaderData
	return (
		<main className="bg-background h-full">
			<section className="relative overflow-hidden py-20 lg:py-32">
				<div className="absolute inset-0">
					<Image
						width={1600}
						height={800}
						loading="eager"
						src="/img/main.webp"
						alt="Wedding Background"
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-black/60" />
					<div className="from-primary/20 absolute inset-0 bg-gradient-to-r to-transparent" />
				</div>

				<div className="relative z-10 container">
					<div className="max-w-3xl">
						<div className="space-y-8 text-white">
							<div className="space-y-4">
								<Badge
									variant="secondary"
									className="w-fit border-white/30 bg-white/20 tracking-wide text-white"
								>
									🇧🇩 Bangladesh's #1 Wedding Marketplace
								</Badge>
								<h1 className="font-serif text-5xl leading-tight font-bold lg:text-7xl">
									Your Dream
									<span className="text-primary block">Wedding</span>
									Awaits
								</h1>
								<p className="max-w-2xl text-xl text-white/90 lg:text-2xl">
									Connect with 1,500+ verified wedding vendors across
									Bangladesh. From photographers to venues, make your special
									day unforgettable with trusted professionals.
								</p>
							</div>

							<div className="flex max-w-2xl flex-col gap-4 sm:flex-row">
								<div className="relative flex-1">
									<Icon
										name="magnifying-glass"
										className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform fill-white stroke-white text-white"
									/>
									<Input
										placeholder="Search vendors, venues, or services..."
										className="h-14 border-white/20 pl-12 text-lg backdrop-blur"
									/>
								</div>
								<Button size="lg" className="h-14 px-8 text-lg font-semibold">
									Find Vendors
								</Button>
							</div>

							<div className="flex flex-wrap items-center gap-8 text-sm text-white/80">
								<div className="flex items-center gap-2">
									<Icon name="shield" className="text-primary h-5 w-5" />
									100% Verified Vendors
								</div>
								<div className="flex items-center gap-2">
									<Icon name="star" className="text-primary h-5 w-5" />
									4.8+ Average Rating
								</div>
								<div className="flex items-center gap-2">
									<Icon name="clock" className="text-primary h-5 w-5" />
									24/7 Support
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="bg-primary py-16">
				<div className="container">
					<div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
						{stats.map((stat, index) => (
							<div key={index} className="text-primary-foreground text-center">
								<Icon
									name={stat.icon as IconName}
									className="mx-auto h-8 w-8 opacity-80"
								/>
								<div className="font-body mt-4 mb-2 text-3xl font-bold lg:text-4xl">
									{stat.number}
								</div>
								<div className="font-title text-sm font-bold opacity-90 lg:text-base">
									{stat.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Service Categories Carousel */}
			<section className="bg-muted/30 py-20">
				<div className="container">
					<div className="mb-16 space-y-4 text-center">
						<h2 className="font-serif text-4xl font-bold lg:text-5xl">
							Wedding Services
						</h2>
						<p className="text-muted-foreground mx-auto max-w-2xl text-xl">
							Everything you need for your perfect wedding day, all in one place
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
						{serviceCategories.map((service, index) => (
							<Card
								key={index}
								className="group bg-secondary/80 cursor-pointer border-0 backdrop-blur transition-all duration-300 hover:shadow-lg"
							>
								<CardHeader className="pb-4 text-center">
									<div
										className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${service.color}`}
									>
										<Icon name={service.icon as IconName} className="h-8 w-8" />
									</div>
									<CardTitle className="text-lg">{service.title}</CardTitle>
									<CardDescription className="text-sm">
										{service.description}
									</CardDescription>
								</CardHeader>
								<CardContent className="text-center">
									<Badge variant="secondary" className="text-xs">
										{service.count}
									</Badge>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Popular Locations */}
			<section className="container py-20">
				<div className="mb-16 space-y-4 text-center">
					<h2 className="font-serif text-4xl font-bold lg:text-5xl">
						Popular Locations
					</h2>
					<p className="text-muted-foreground mx-auto max-w-2xl text-xl">
						Discover amazing wedding venues across Bangladesh's major cities
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{popularLocations.map((location, index) => (
						<Card
							key={index}
							className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl"
						>
							<div className="relative aspect-[4/3] overflow-hidden">
								<Image
									width={300}
									height={200}
									loading="lazy"
									src={location.image || '/placeholder.svg'}
									alt={location.name}
									className="object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
								<div className="absolute bottom-4 left-4 text-white">
									<h3 className="font-serif text-2xl font-bold">
										{location.name}
									</h3>
									<p className="text-white/90">
										{location.venues} venues available
									</p>
								</div>
							</div>
						</Card>
					))}
				</div>
			</section>

			{/* Venue Styles */}
			<section className="py-20">
				<div className="container">
					<div className="mb-16 space-y-4 text-center">
						<h2 className="font-serif text-4xl font-bold lg:text-5xl">
							Venue Styles
						</h2>
						<p className="text-muted-foreground mx-auto max-w-2xl text-xl">
							Choose from diverse venue types that match your wedding vision and
							budget
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						{venueStyles.map((venue, index) => (
							<Card
								key={index}
								className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl"
							>
								<div className="relative aspect-[4/3] overflow-hidden">
									<Image
										width={400}
										height={250}
										loading="lazy"
										src={venue.image || '/placeholder.svg'}
										alt={venue.title}
										className="object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<div className="absolute top-4 right-4">
										<Badge className="text-foreground bg-white/90">
											{venue.count}
										</Badge>
									</div>
								</div>
								<CardHeader>
									<CardTitle className="text-xl">{venue.title}</CardTitle>
									<CardDescription>{venue.description}</CardDescription>
									<div className="flex items-center justify-between pt-2">
										<span className="text-muted-foreground text-sm">
											Starting from
										</span>
										<span className="text-primary font-semibold">
											{venue.priceRange}
										</span>
									</div>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Featured Vendors */}
			<section className="bg-muted/30 py-20">
				<div className="container">
					<div className="mb-12 flex items-end justify-between">
						<div className="space-y-4">
							<h2 className="font-serif text-4xl font-bold lg:text-5xl">
								Featured Vendors
							</h2>
							<p className="text-muted-foreground text-xl">
								Premium vendors trusted by thousands of couples
							</p>
						</div>
						<Button variant="outline" size="lg">
							View All Vendors
						</Button>
					</div>

					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
						{featuredVendors.map((vendor, index) => (
							<Card
								key={index}
								className="group overflow-hidden transition-all duration-300 hover:shadow-xl"
							>
								<div className="relative aspect-[4/3] overflow-hidden">
									<Image
										width={400}
										height={300}
										loading="lazy"
										src={vendor.image || '/placeholder.svg'}
										alt={vendor.name}
										className="object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<div className="absolute top-4 left-4">
										<Badge
											className={`${vendor.badge === 'Premium' ? 'bg-primary' : vendor.badge === 'Popular' ? 'bg-blue-600' : 'bg-green-600'} text-white`}
										>
											{vendor.badge}
										</Badge>
									</div>
									{vendor.verified && (
										<div className="absolute top-4 right-4">
											<div className="rounded-full bg-white/90 p-1">
												<Icon
													name="circle-check"
													className="h-4 w-4 text-green-600"
												/>
											</div>
										</div>
									)}
								</div>
								<CardHeader className="pb-2">
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="text-lg leading-tight">
												{vendor.name}
											</CardTitle>
											<CardDescription className="flex items-center gap-1 text-sm">
												<Icon name="map-pin" className="h-3 w-3" />
												{vendor.location}
											</CardDescription>
										</div>
										<Badge variant="secondary" className="text-xs">
											{vendor.category}
										</Badge>
									</div>

									<div className="flex items-center justify-between pt-2">
										<div className="flex items-center gap-1">
											<Icon
												name="star"
												className="fill-primary text-primary h-4 w-4"
											/>
											<span className="text-sm font-semibold">
												{vendor.rating}
											</span>
											<span className="text-muted-foreground text-xs">
												({vendor.reviews})
											</span>
										</div>
										<div className="text-right">
											<p className="text-primary text-sm font-semibold">
												{vendor.price}
											</p>
											<p className="text-muted-foreground text-xs">
												Starting from
											</p>
										</div>
									</div>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className="py-20">
				<div className="container">
					<div className="mb-16 space-y-4 text-center">
						<h2 className="font-serif text-4xl font-bold lg:text-5xl">
							What Couples Say
						</h2>
						<p className="text-muted-foreground mx-auto max-w-2xl text-xl">
							Real stories from couples who found their perfect wedding vendors
							on ShuvoDin
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						{testimonials.map((testimonial, index) => (
							<Card key={index} className="relative">
								<CardHeader>
									<Icon
										name="quote"
										className="text-primary/20 absolute top-4 right-4 h-8 w-8"
									/>
									<div className="flex items-center gap-4">
										<Image
											src={testimonial.image || '/placeholder.svg'}
											alt={testimonial.name}
											width={60}
											height={60}
											className="rounded-full"
										/>
										<div>
											<CardTitle className="text-lg">
												{testimonial.name}
											</CardTitle>
											<CardDescription>{testimonial.location}</CardDescription>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="mb-4 flex">
										{[...Array(testimonial.rating)].map((_, i) => (
											<Icon
												name="star"
												key={i}
												className="fill-primary text-primary h-4 w-4"
											/>
										))}
									</div>
									<p className="text-muted-foreground italic">
										"{testimonial.text}"
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative overflow-hidden py-20">
				<div className="absolute inset-0">
					<Image
						width={1600}
						height={800}
						loading="eager"
						src="/placeholder.svg?height=600&width=1600&text=Wedding+Celebration"
						alt="Wedding Celebration"
						className="object-cover"
					/>
					<div className="bg-primary/90 absolute inset-0" />
				</div>

				<div className="relative z-10 container text-center">
					<div className="text-primary-foreground mx-auto max-w-4xl space-y-8">
						<h2 className="font-serif text-4xl font-bold lg:text-6xl">
							Ready to Plan Your Dream Wedding?
						</h2>
						<p className="text-xl opacity-90 lg:text-2xl">
							Join 10,000+ couples who found their perfect vendors on ShuvoDin.
							Start planning your special day today!
						</p>
						<div className="flex flex-col justify-center gap-6 sm:flex-row">
							<Button
								size="lg"
								variant="secondary"
								className="h-14 px-8 text-lg font-semibold"
							>
								<Icon name="magnifying-glass" className="mr-2 h-5 w-5" />
								Find Vendors Now
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary h-14 bg-transparent px-8 text-lg font-semibold"
							>
								<Icon name="users" className="mr-2 h-5 w-5" />
								Join as Vendor
							</Button>
						</div>

						<div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm opacity-80">
							<div className="flex items-center gap-2">
								<Icon name="phone" className="h-4 w-4" />
								24/7 Customer Support
							</div>
							<div className="flex items-center gap-2">
								<Icon name="shield" className="h-4 w-4" />
								100% Secure Booking
							</div>
							<div className="flex items-center gap-2">
								<Icon name="award" className="h-4 w-4" />
								Quality Guaranteed
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
