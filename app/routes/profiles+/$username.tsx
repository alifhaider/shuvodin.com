import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { formatDate } from 'date-fns'
import { Img } from 'openimg/react'
import { data, Link, useFetcher } from 'react-router'
import { z } from 'zod'
import Breadcrumb from '#app/components/breadcrumb.tsx'
import { Avatar, AvatarFallback } from '#app/components/ui/avatar.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Progress } from '#app/components/ui/progress.tsx'
import { getUserId, requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getUserImgSrc, getVendorImgSrc } from '#app/utils/misc.tsx'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { FavoriteVendorForm } from '../resources+/favorite-vendor-form'
import { type Route } from './+types/$username'
import { type IconName } from '@/icon-name'

// Helper function for status color
function getStatusColor(status: string) {
	switch (status) {
		case 'completed':
		case 'confirmed':
			return 'bg-green-500'
		case 'upcoming':
			return 'bg-blue-500'
		case 'cancelled':
			return 'bg-red-500'
		default:
			return 'bg-gray-500'
	}
}

export const meta = ({ data }: Route.MetaArgs) => {
	return [
		{ title: `${data?.user.name ?? data?.user.username} / ShuvoDin` },
		{
			name: 'description',
			content: `ShuvoDin ${data?.user.name || data?.user.username} Profile!`,
		},
	]
}

export async function loader({ request, params }: Route.LoaderArgs) {
	const loggedInUserId = await getUserId(request)

	// Base query - always include public information
	const baseSelect = {
		include: {
			vendor: {
				select: {
					id: true,
					businessName: true,
					vendorType: { select: { name: true } },
					rating: true,
					_count: { select: { bookings: true } },
				},
			},
			image: { select: { objectKey: true, altText: true } },
			_count: { select: { reviews: true, favorites: true, bookings: true } },
		},
		where: { username: params.username },
	}

	const user = await prisma.user.findFirst(baseSelect)
	invariantResponse(user, 'User not found', { status: 404 })

	const isOwner = loggedInUserId === user.id
	const isVendor = !!user.vendor

	// If user is viewing their own profile, include private data
	if (isOwner) {
		const userWithPrivateData = await prisma.user.findFirst({
			include: {
				...baseSelect.include,
				favorites: {
					select: {
						id: true,
						slug: true,
						businessName: true,
						district: true,
						thana: true,
						gallery: { select: { objectKey: true, altText: true } },
						address: true,
						division: true,
						rating: true,
						vendorType: { select: { name: true } },
					},
					orderBy: { createdAt: 'desc' },
				},
				reviews: {
					orderBy: { createdAt: 'desc' },
					take: 3,
					select: {
						id: true,
						rating: true,
						comment: true,
						createdAt: true,
						vendor: { select: { businessName: true, slug: true } },
					},
				},
				bookings: {
					select: {
						id: true,
						totalPrice: true,
						status: true,
						date: true,
						vendor: {
							select: {
								businessName: true,
								slug: true,
								district: true,
								thana: true,
								address: true,
								division: true,
								rating: true,
								vendorType: { select: { name: true } },
								venueDetails: {
									select: {
										spaces: {
											select: {
												sittingCapacity: true,
												standingCapacity: true,
												parkingCapacity: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
			where: baseSelect.where,
		})

		invariantResponse(userWithPrivateData, 'User not found', { status: 404 })

		const vendorId = userWithPrivateData.vendor?.id

		if (!vendorId) {
			return {
				user: userWithPrivateData,
				userJoinedDisplay: userWithPrivateData.createdAt.toLocaleDateString(),
				isOwner,
				loggedInUserId,
				isVendor,
			}
		}

		const [vendorBookings, groupedCounts] = await Promise.all([
			prisma.booking.findMany({
				where: {
					vendorId,
					status: { in: ['pending', 'confirmed'] },
					date: { gte: new Date() },
				},
				orderBy: [{ status: 'asc' }, { date: 'asc' }],
				take: 20,
				select: {
					id: true,
					status: true,
					date: true,
					totalPrice: true,
					user: { select: { username: true, name: true } },
					vendor: { select: { businessName: true, slug: true } },
				},
			}),
			prisma.booking.groupBy({
				by: ['status'],
				where: {
					vendorId,
					status: { in: ['pending', 'confirmed'] },
					date: { gte: new Date() },
				},
				_count: { status: true },
			}),
		])

		const vendorPendingBookings = vendorBookings
			.filter((b) => b.status === 'pending')
			.slice(0, 2)

		const vendorUpcomingBookings = vendorBookings
			.filter((b) => b.status === 'confirmed')
			.slice(0, 2)

		const vendorPendingBookingCount =
			groupedCounts.find((g) => g.status === 'pending')?._count.status ?? 0
		const vendorUpcomingBookingCount =
			groupedCounts.find((g) => g.status === 'confirmed')?._count.status ?? 0

		return {
			user: userWithPrivateData,
			userJoinedDisplay: userWithPrivateData.createdAt.toLocaleDateString(),
			isOwner,
			loggedInUserId,
			isVendor,
			vendorPendingBookings,
			vendorUpcomingBookings,
			vendorPendingBookingCount,
			vendorUpcomingBookingCount,
		}
	}

	// For non-owners (logged-in users viewing other profiles or non-logged-in users)
	return {
		user: {
			...user,
			// Explicitly set private data to null/empty for non-owners
			favorites: [],
			reviews: [],
			bookings: [],
			// Keep vendor info public but remove sensitive vendor data
			vendor: user.vendor
				? {
						id: user.vendor.id,
						businessName: user.vendor.businessName,
						vendorType: user.vendor.vendorType,
						rating: user.vendor.rating,
						_count: user.vendor._count,
					}
				: null,
		},
		userJoinedDisplay: user.createdAt.toLocaleDateString(),
		isOwner: false,
		loggedInUserId,
		isVendor,
		vendorPendingBookings: [],
		vendorUpcomingBookings: [],
		vendorPendingBookingCount: 0,
		vendorUpcomingBookingCount: 0,
	}
}

export async function action({ request }: Route.ActionArgs) {
	await requireUserId(request)
	const formData = await request.formData()
	const { _action } = Object.fromEntries(formData)

	async function cancelBooking(formData: FormData) {
		await requireUserId(request)
		const submission = parseWithZod(formData, {
			schema: z.object({
				bookingId: z.string(),
			}),
		})

		if (submission.status !== 'success') {
			return data(
				{ success: false, result: submission.reply() },
				{
					headers: await createToastHeaders({
						description: 'There was an error cancelling the booking',
						type: 'error',
					}),
				},
			)
		}

		const bookingId = submission.value.bookingId

		await prisma.booking.delete({ where: { id: bookingId } })

		return data(
			{ success: true, result: submission.reply() },
			{
				headers: await createToastHeaders({
					description: 'Booking cancelled successfully',
					type: 'success',
				}),
			},
		)
	}

	switch (_action) {
		case 'cancel-booking':
			return cancelBooking(formData)
		default:
			return data(
				{ success: false, result: {} },
				{
					headers: await createToastHeaders({
						description: 'Invalid action',
						type: 'error',
					}),
				},
			)
	}
}

export default function VendorRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const {
		isVendor,
		isOwner,
		user,
		userJoinedDisplay,
		vendorPendingBookings,
		vendorUpcomingBookings,
		vendorPendingBookingCount,
		vendorUpcomingBookingCount,
	} = loaderData

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.toUpperCase()
	}

	const userDisplayName = user.name ?? user.username
	const initials = getInitials(userDisplayName)
	const userImgSrc = getUserImgSrc(user.image?.objectKey)

	return (
		<>
			<section className="container mb-8 flex flex-col gap-6 pt-6 lg:flex-row">
				<Breadcrumb
					items={[
						{ to: '/', label: 'Home' },
						{
							to: `/profiles/${user.username}`,
							label: user.name ?? user.username,
							isCurrent: true,
						},
					]}
				/>
			</section>
			<section className="container">
				<div className="mb-8 border-b-4 p-8 shadow-sm md:mb-12">
					<div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
						<div className="flex flex-1 items-center gap-6">
							<Avatar className="h-20 w-20 border-2">
								{user.image ? (
									<Img
										src={userImgSrc}
										alt={user.image.altText || userDisplayName}
										className="h-full w-full"
										width={80}
										height={80}
									/>
								) : (
									<AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
										{initials}
									</AvatarFallback>
								)}
							</Avatar>

							<div className="flex-1">
								<div className="mb-3 flex items-center gap-3">
									<h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
										{user.name}
									</h1>
									{isVendor && (
										<Badge className="bg-accent text-primary border-accent">
											<Icon name="award" className="mr-1 h-3 w-3" />
											Vendor
										</Badge>
									)}
								</div>

								<div className="mb-4 flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-200">
									<div className="flex items-center gap-1">
										<Icon
											name="calendar-days"
											className="text-primary h-4 w-4"
										/>
										<span>Joined {userJoinedDisplay}</span>
									</div>

									{isOwner && (
										<>
											{user.email && (
												<div className="flex items-center gap-1">
													<Icon name="mail" className="text-primary h-4 w-4" />
													<span>{user.email}</span>
												</div>
											)}
											{user.phone && (
												<div className="flex items-center gap-1">
													<Icon name="phone" className="text-primary h-4 w-4" />
													<span>{user.phone}</span>
												</div>
											)}
										</>
									)}
								</div>

								{/* Stats Row */}
								<div className="flex flex-wrap gap-8">
									<div>
										<div className="text-primary text-2xl font-bold">
											{user._count.bookings}
										</div>
										<div className="text-sm text-slate-600 dark:text-slate-200">
											Bookings
										</div>
									</div>
									<div>
										<div className="text-primary text-2xl font-bold">
											{user._count.reviews}
										</div>
										<div className="text-sm text-slate-600 dark:text-slate-200">
											Reviews
										</div>
									</div>
									<div>
										<div className="text-primary text-2xl font-bold">
											{user._count.favorites}
										</div>
										<div className="text-sm text-slate-600 dark:text-slate-200">
											Favorites
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="flex gap-3">
							<Button asChild variant="outline" size="sm">
								<Link to="/settings/profile">
									<Icon name="settings" className="mr-2 h-4 w-4" />
									Settings
								</Link>
							</Button>
							<Button asChild size="sm">
								<Link to="/vendors">
									<Icon name="trending-up" className="mr-2 h-4 w-4" />
									Browse Venues
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Vendor Section (if user is a vendor) */}
			{isVendor && (
				<section className="container mb-8 md:mb-12">
					<SectionHeader
						title="Vendor Profile"
						description="Overview of vendor stats"
						iconName="building"
					/>

					<div className="from-primary/10 to-primary/5 relative overflow-hidden rounded-lg border bg-gradient-to-r p-4">
						<div className="flex flex-col justify-between md:flex-row md:items-center">
							<div>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="bg-primary/10 text-xs font-medium capitalize md:text-base"
									>
										{user.vendor?.vendorType?.name}
									</Badge>
									<h2 className="text-lg font-semibold md:text-2xl">
										{user.vendor?.businessName}
									</h2>
								</div>

								<div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3">
									<div>
										<p className="text-muted-foreground text-xs md:text-base">
											Avg Rating
										</p>
										<div className="flex items-center gap-1">
											<Icon
												name="star"
												className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
											/>
											<p className="text-sm font-medium md:text-lg">
												{user.vendor?.rating}
											</p>
										</div>
									</div>
									<div>
										<p className="text-muted-foreground text-xs md:text-base">
											Total Bookings
										</p>
										<p className="text-sm font-medium md:text-lg">
											{user.vendor?._count.bookings}
										</p>
									</div>
								</div>
							</div>

							{isOwner && (
								<div className="mt-4 md:mt-0">
									<Button asChild size="sm">
										<Link to="/dashboard">
											Go to Dashboard
											<Icon name="chevron-right" className="ml-1 h-3.5 w-3.5" />
										</Link>
									</Button>
								</div>
							)}
						</div>

						<div className="mt-4">
							<p className="text-muted-foreground text-xs md:text-base">
								Revenue this month
							</p>
							<div className="mt-1 flex items-center justify-between">
								<p className="text-sm font-medium md:text-lg">৳40000</p>
								<p className="text-xs text-green-600 md:text-base">
									+12% from last month
								</p>
							</div>
							<Progress value={65} className="mt-1.5 h-1.5" />
						</div>
					</div>
				</section>
			)}

			{/* Pending Bookings */}
			{vendorPendingBookings &&
				vendorPendingBookings?.length > 0 &&
				isOwner && (
					<section className="container mb-8">
						<SectionHeader
							title="Pending Booking Requests"
							description={`${vendorPendingBookingCount} awaiting booking confirmation`}
							iconName="circle-alert"
						/>

						<ul className="space-y-4">
							{vendorPendingBookings.map((booking) => (
								<li
									key={booking.id}
									className="border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 p-4 shadow-sm dark:from-amber-950 dark:to-amber-900"
								>
									<div className="mb-3 flex items-start justify-between">
										<div>
											<div className="mb-1 flex items-center gap-2">
												<Icon
													name="user"
													className="h-4 w-4 text-slate-600 dark:text-slate-400"
												/>
												<span className="font-semibold text-slate-900 dark:text-slate-100">
													{booking.user.name || booking.user.username}
												</span>
											</div>
											<div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
												<div className="flex items-center gap-4">
													<span className="flex items-center gap-1">
														<Icon
															name="calendar-days"
															className="h-3 w-3 text-blue-500"
														/>
														{formatDate(booking.date, 'PPP')}
													</span>
												</div>
												<div className="flex items-center gap-4">
													<span className="font-semibold text-slate-900 dark:text-slate-100">
														৳{booking.totalPrice.toLocaleString()}
													</span>
												</div>
											</div>
										</div>
									</div>

									<Button
										size="sm"
										variant="outline"
										className="text-primary h-7 border-amber-400 bg-transparent text-xs hover:bg-amber-50 dark:border-amber-800 hover:dark:bg-amber-900"
										asChild
									>
										<Link to={`/dashboard/bookings/${booking.id}`}>
											View Details
										</Link>
									</Button>
								</li>
							))}
						</ul>
					</section>
				)}

			{vendorUpcomingBookingCount &&
				vendorUpcomingBookingCount > 0 &&
				isOwner && (
					<section className="container mb-8 md:mb-12">
						<div className="mb-4 flex items-center gap-3">
							<div className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900">
								<Icon
									name="circle-check"
									className="h-5 w-5 text-emerald-600"
								/>
							</div>
							<div>
								<h3 className="text-lg font-semibold text-slate-900 md:text-2xl dark:text-slate-100">
									Upcoming Events
								</h3>
								<p className="text-sm text-slate-600 dark:text-slate-400">
									{vendorUpcomingBookingCount} confirmed bookings
								</p>
							</div>
						</div>

						<ul className="space-y-4">
							{vendorUpcomingBookings.map((booking) => (
								<li
									key={booking.id}
									className="border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 shadow-sm dark:from-emerald-950 dark:to-emerald-900"
								>
									<div className="mb-3 flex items-start justify-between">
										<div>
											<div className="mb-1 flex items-center gap-2">
												<Icon
													name="user"
													className="h-4 w-4 text-slate-600 dark:text-slate-400"
												/>
												<span className="font-semibold text-slate-900 dark:text-slate-100">
													{booking.user.name || booking.user.username}
												</span>
											</div>
											<div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
												<div className="flex items-center gap-4">
													<span className="flex items-center gap-1">
														<Icon
															name="calendar-days"
															className="h-3 w-3 text-blue-500"
														/>
														{formatDate(booking.date, 'PPP')}
													</span>
												</div>
												<div className="flex items-center gap-4">
													<span className="font-semibold text-slate-900 dark:text-slate-100">
														৳{booking.totalPrice.toLocaleString()}
													</span>
												</div>
											</div>
										</div>
									</div>

									<Button
										size="sm"
										variant="outline"
										className="text-primary h-7 border-emerald-400 bg-transparent text-xs hover:bg-emerald-50 dark:border-emerald-800 hover:dark:bg-emerald-900"
										asChild
									>
										<Link to={`/dashboard/bookings/${booking.id}`}>
											View Details
										</Link>
									</Button>
								</li>
							))}
						</ul>
					</section>
				)}

			{/* User Profile Section */}
			<section className="container mb-8 md:mb-12">
				<div className="mb-6 flex items-center justify-between">
					<SectionHeader
						title="Favorite Venues"
						description="Your saved venues for quick access"
						iconName="heart"
					/>
					{user.favorites.length > 4 && (
						<Link
							to="/favorites"
							className="text-primary text-sm font-medium hover:underline md:text-base"
						>
							View all
							<Icon name="chevron-right" className="ml-1 inline h-3 w-3" />
						</Link>
					)}
				</div>

				<ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{user.favorites.slice(0, 4).map((fvrt) => (
						<li
							key={fvrt.slug}
							className="group hover:border-accent relative overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
						>
							<div className="aspect-[4/3] overflow-hidden">
								<Img
									width={400}
									height={300}
									src={
										getVendorImgSrc(fvrt.gallery[0]?.objectKey) ||
										'/images/placeholder.png'
									}
									alt={fvrt.gallery[0]?.altText || fvrt.businessName}
									className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

								<div className="absolute top-2 right-2 z-10">
									<FavoriteVendorForm vendorId={fvrt.id} isFavorited />
								</div>
							</div>

							<div className="absolute right-0 bottom-0 left-0 bg-white/95 p-3 backdrop-blur-sm">
								<h3 className="mb-1 line-clamp-1 text-sm font-semibold text-slate-900">
									{fvrt.businessName}
								</h3>
								<div className="mb-2 flex flex-col text-xs">
									<div className="flex items-center gap-1">
										<Icon
											name="star"
											className="h-3 w-3 fill-amber-400 text-amber-400"
										/>
										<span className="font-medium text-slate-700">
											{fvrt.rating}
										</span>
									</div>
									<div className="flex items-center gap-1 text-slate-600">
										<Icon name="map-pin" className="h-3 w-3" />
										<span>
											{fvrt.thana}, {fvrt.district}, {fvrt.division}
										</span>
									</div>
								</div>
							</div>

							<Link to={`/vendors/${fvrt.slug}`} className="absolute inset-0" />
						</li>
					))}
				</ul>
			</section>
			<section className="container mb-8 md:mb-12">
				<SectionHeader
					title=" Booking History"
					description="Past and upcoming bookings"
					iconName="calendar-days"
				/>

				<div className="relative">
					{/* Timeline Line */}
					<div className="absolute top-0 bottom-0 left-6 w-0.5 bg-slate-300 dark:bg-slate-600"></div>

					<div className="space-y-6">
						{user.bookings.map((booking) => (
							<div key={booking.id} className="relative flex items-start gap-6">
								<div
									className={`relative z-10 h-3 w-3 rounded-full ${getStatusColor(booking.status)} shadow-sm ring-4 ring-white dark:ring-slate-900`}
								/>

								{/* Booking Content */}
								<div className="from-primary/10 to-primary/5 hover:border-primary flex-1 rounded-lg border bg-gradient-to-r p-4 transition-all duration-200 hover:shadow-sm">
									<div className="mb-3 flex items-center justify-between">
										<div>
											<h3 className="font-semibold text-slate-900 dark:text-slate-50">
												{booking.vendor.businessName}
											</h3>
											<div className="text-secondary-foreground mt-1 flex items-center gap-4 text-sm">
												<span className="flex items-center gap-1">
													<Icon
														name="calendar-days"
														className="text-primary h-3 w-3"
													/>
													{formatDate(booking.date, 'PPP')}
												</span>
											</div>
										</div>

										<div className="text-right">
											<div className="font-semibold text-slate-900">
												৳{booking.totalPrice.toLocaleString()}
											</div>
											<Badge
												variant={
													booking.status === 'completed' ||
													booking.status === 'confirmed'
														? 'secondary'
														: booking.status === 'upcoming'
															? 'outline'
															: 'destructive'
												}
												className="mt-1 text-xs"
											>
												{booking.status.charAt(0).toUpperCase() +
													booking.status.slice(1)}
											</Badge>
										</div>
									</div>

									<div className="flex gap-2">
										{booking.status === 'upcoming' && (
											<CancelBookingButton
												bookingId={booking.id}
												actionData={actionData}
											/>
										)}
										<Button
											size="sm"
											variant="outline"
											className="text-primary h-7 border-amber-400 bg-transparent text-xs hover:bg-amber-50 dark:border-amber-800"
											asChild
										>
											<Link to={`/vendors/${booking.vendor.slug}`}>
												View {booking.vendor.vendorType?.name || 'Venue'}
											</Link>
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Reviews Section */}
			<section className="container mb-8">
				<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
					<SectionHeader
						title="Reviews"
						description={`${user.reviews.length} reviews written`}
						iconName="star"
					/>

					<ul className="space-y-4">
						{user.reviews.slice(0, 2).map((review) => (
							<li
								key={review.id}
								className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-900"
							>
								<div className="mb-2 flex items-center justify-between">
									<Link
										to={`/vendors/${review.vendor.slug}`}
										className="line-clamp-1 text-sm font-medium text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
									>
										{review.vendor.businessName}
									</Link>
									<div className="flex items-center">
										{[...Array(5)].map((_, i) => (
											<Icon
												name="star"
												key={i}
												className={cn('h-3 w-3 fill-transparent', {
													'fill-amber-400 text-amber-400':
														i < Math.floor(review.rating),
													'text-slate-300': i >= Math.floor(review.rating),
												})}
											/>
										))}
									</div>
								</div>
								<p className="mb-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
									{review.comment}
								</p>
								<p className="text-xs text-slate-400 dark:text-slate-600">
									{formatDate(review.createdAt, 'dd MMM, yyyy')}
								</p>
							</li>
						))}
					</ul>

					{user.reviews.length > 2 && (
						<Link
							to="/profile/reviews"
							className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
						>
							View All Reviews
							<Icon name="chevron-right" className="ml-1 inline h-3 w-3" />
						</Link>
					)}
				</div>
			</section>

			<section className="container mb-8">
				<div className="rounded-lg border border-slate-200 bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-900">
					<h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">
						Quick Actions
					</h3>
					<div className="space-y-3">
						<Button
							asChild
							variant="ghost"
							className="w-full justify-start text-slate-700 hover:bg-white hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
						>
							<Link to="/vendors">
								<Icon name="trending-up" className="mr-3 h-4 w-4" />
								Browse Vendors
							</Link>
						</Button>
						<Button
							asChild
							variant="ghost"
							className="w-full justify-start fill-transparent text-slate-700 hover:bg-white hover:text-rose-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-rose-400"
						>
							<Link to="/favorites">
								<Icon name="heart" className="mr-3 h-4 w-4" />
								My Favorites
							</Link>
						</Button>
						<Button
							asChild
							variant="ghost"
							className="w-full justify-start text-slate-700 hover:bg-white hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
						>
							<Link to="/bookings">
								<Icon name="calendar-days" className="mr-3 h-4 w-4" />
								My Bookings
							</Link>
						</Button>
						{isVendor && (
							<Button
								asChild
								variant="ghost"
								className="w-full justify-start text-slate-700 hover:bg-white hover:text-purple-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-purple-400"
							>
								<Link to="/dashboard">
									<Icon name="award" className="mr-3 h-4 w-4" />
									Vendor Dashboard
								</Link>
							</Button>
						)}
					</div>
				</div>
			</section>
		</>
	)
}

function CancelBookingButton({
	bookingId,
	actionData,
}: {
	bookingId: string
	actionData: Route.ComponentProps['actionData']
}) {
	const deleteFetcher = useFetcher()
	const [form, fields] = useForm({
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: z.object({ bookingId: z.string() }),
			})
		},
		shouldRevalidate: 'onSubmit',
	})

	return (
		<deleteFetcher.Form method="POST" {...getFormProps(form)}>
			<input
				{...getInputProps(fields.bookingId, { type: 'hidden' })}
				value={bookingId}
			/>
			<button
				name="_action"
				value="cancel-booking"
				type="submit"
				className="border-destructive bg-destructive text-destructive-foreground flex w-max items-start rounded-md border px-2 py-1 transition-all"
			>
				Cancel Booking
			</button>
		</deleteFetcher.Form>
	)
}

const SectionHeader = ({
	title,
	iconName,
	description,
}: {
	title: string
	iconName: IconName
	description: string
}) => {
	return (
		<div className="mb-4 flex items-center gap-3">
			<div className="aspect-square rounded-lg border border-amber-200 bg-amber-100 px-3 py-2 dark:border-amber-800 dark:bg-amber-800">
				<Icon
					name={iconName}
					className="h-5 w-5 fill-transparent text-rose-600"
				/>
			</div>
			<div>
				<h4 className="text-lg font-semibold text-slate-900 md:text-2xl dark:text-slate-100">
					{title}
				</h4>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					{description}
				</p>
			</div>
		</div>
	)
}
