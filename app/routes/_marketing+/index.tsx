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
import { Icon } from '#app/components/ui/icon.tsx'
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

export const meta: Route.MetaFunction = () => [{ title: 'Epic Notes' }]

// Tailwind Grid cell classes lookup
const columnClasses: Record<(typeof logos)[number]['column'], string> = {
	1: 'xl:col-start-1',
	2: 'xl:col-start-2',
	3: 'xl:col-start-3',
	4: 'xl:col-start-4',
	5: 'xl:col-start-5',
}
const rowClasses: Record<(typeof logos)[number]['row'], string> = {
	1: 'xl:row-start-1',
	2: 'xl:row-start-2',
	3: 'xl:row-start-3',
	4: 'xl:row-start-4',
	5: 'xl:row-start-5',
	6: 'xl:row-start-6',
}

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
	const [open, setOpen] = React.useState(false)
	const [value, setValue] = React.useState('')
	const { vendorCategories } = loaderData
	return (
		<main className="bg-background h-full">
			<section className="relative overflow-hidden py-20 lg:py-32">
				<div className="from-primary/10 via-accent/5 to-secondary/10 absolute inset-0 bg-gradient-to-br" />
				<div className="relative container">
					<div className="grid items-center gap-12 lg:grid-cols-2">
						<div className="space-y-8">
							<div className="space-y-4">
								<h1 className="text-foreground font-serif text-4xl leading-tight font-bold lg:text-6xl">
									Your Perfect
									<span className="text-primary block">Wedding Day</span>
									Starts Here
								</h1>
								<p className="text-muted-foreground max-w-lg text-xl">
									Connect with the best wedding vendors in Bangladesh. From
									photographers to venues, find everything you need for your
									special day.
								</p>
							</div>

							<div className="text-muted-foreground flex items-center gap-8 text-sm">
								<div className="flex items-center gap-2">
									<Icon name="shield" className="text-primary h-4 w-4" />
									Verified Vendors
								</div>
								<div className="flex items-center gap-2">
									<Icon name="star" className="text-primary h-4 w-4" />
									Rated & Reviewed
								</div>
								<div className="flex items-center gap-2">
									<Icon name="heart" className="text-primary h-4 w-4" />
									Trusted by 10k+ Couples
								</div>
							</div>
						</div>

						<div className="relative">
							<div className="from-primary/20 to-accent/20 aspect-square overflow-hidden rounded-2xl bg-gradient-to-br">
								<Image
									src="/placeholder.svg?height=600&width=600"
									alt="Beautiful Wedding"
									width={600}
									height={600}
									className="h-full w-full object-cover"
								/>
							</div>
							<div className="bg-card absolute -bottom-6 -left-6 rounded-xl border p-4 shadow-lg">
								<div className="flex items-center gap-3">
									<Icon name="calendar" className="text-primary h-8 w-8" />
									<div>
										<p className="font-semibold">Book in Advance</p>
										<p className="text-muted-foreground text-sm">
											Save up to 20%
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			<section className="bg-muted/30 container py-20">
				<h2 className="text-foreground text-center text-2xl font-bold md:text-4xl">
					Find Your Perfect Wedding Vendors
				</h2>
				<p className="text-muted-foreground mt-2 text-center text-lg md:mt-3">
					Explore our curated list of wedding vendors to make your day special.
				</p>
				{vendorCategories.length > 0 && (
					<ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{vendorCategories.map((category) => (
							<li
								key={category.id}
								className="group border-muted-foreground/20 hover:border-primary relative rounded-lg border p-4 transition-colors"
							>
								{category.name}
							</li>
						))}
					</ul>
				)}
				<div className="mt-4 flex justify-center">
					<Button onClick={() => setOpen(true)}>View Vendors</Button>
				</div>
			</section>
		</main>
	)
}
