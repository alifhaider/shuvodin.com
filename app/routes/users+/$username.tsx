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
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { VendorBookingAction } from '../resources+/vendor-booking-action'
import { type Route } from './+types/$username'
import { IconName } from '@/icon-name'

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
		{ title: `${data?.user.username} / ShuvoDin` },
		{
			name: 'description',
			content: `ShuvoDin ${data?.user.name || data?.user.username} Profile!`,
		},
	]
}

export async function loader({ request, params }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const page = url.searchParams.get('page')
	const user = await prisma.user.findFirst({
		include: {
			image: {
				select: {
					objectKey: true,
					altText: true,
				},
			},
			favorites: {
				select: {
					slug: true,
					businessName: true,
					district: true,
					thana: true,
					address: true,
					division: true,
					rating: true,
					vendorType: { select: { name: true } },
				},
			},
			reviews: {
				orderBy: { createdAt: 'desc' },
				take: 3,
				skip: page ? (Number(page) - 1) * 3 : 0,
				select: {
					id: true,
					rating: true,
					comment: true,
					createdAt: true,
					vendor: { select: { businessName: true, slug: true } },
				},
			},
			vendor: {
				select: {
					id: true,
					slug: true,
					businessName: true,
					rating: true,
					vendorType: { select: { name: true } },
					bookings: {
						select: {
							id: true,
							status: true,
							date: true,
							user: { select: { username: true, name: true } },
							totalPrice: true,
							vendor: { select: { businessName: true, slug: true } },
						},
					},
					_count: { select: { bookings: true } },
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

			_count: {
				select: {
					reviews: true,
					favorites: true,
					bookings: true,
				},
			},
		},

		where: { username: params.username },
	})

	invariantResponse(user, 'User not found', { status: 404 })

	const loggedInUserId = await getUserId(request)
	const isOwner = loggedInUserId === user.id
	const isVendor = !!user.vendor
	return {
		user,
		userJoinedDisplay: user.createdAt.toLocaleDateString(),
		isOwner,
		loggedInUserId,
		isVendor,
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
	const { isVendor, isOwner, user, userJoinedDisplay } = loaderData

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
	const pendingBookings = user.vendor?.bookings.filter(
		(b) => b.status === 'pending',
	)
	return (
		<>
			<section className="container mb-8 flex flex-col gap-6 pt-6 lg:flex-row">
				<Breadcrumb
					items={[
						{ to: '/', label: 'Home' },
						{ to: `/users`, label: 'Users' },
						{
							to: `/users/${user.username}`,
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
								<Link to="/profile/settings">
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
					<div className="mb-4 flex items-center gap-3">
						<div className="rounded-lg border border-amber-200 bg-amber-100 p-2 dark:border-amber-800 dark:bg-amber-900">
							<Icon name="building" className="h-5 w-5 text-amber-600" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-slate-900 md:text-lg dark:text-slate-50">
								Vendor Profile
							</h3>
							<p className="text-slate-600 dark:text-slate-400">
								Glance at your vendor profile and manage your business.
							</p>
						</div>
					</div>

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

							<div className="mt-4 md:mt-0">
								<Button asChild size="sm">
									<Link to="/dashboard">
										Go to Dashboard
										<Icon name="chevron-right" className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>
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
			{pendingBookings && pendingBookings?.length > 0 && isOwner && (
				<section className="container mb-8">
					<div className="mb-4 flex items-center gap-3">
						<div className="rounded-lg border border-amber-200 bg-amber-100 p-2 dark:border-amber-800 dark:bg-amber-900">
							<Icon name="circle-alert" className="h-5 w-5 text-amber-600" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-slate-900 md:text-lg dark:text-slate-50">
								Pending Bookings
							</h3>
							<p className="text-slate-600 dark:text-slate-400">
								{user.vendor?.bookings.length} awaiting booking confirmation
							</p>
						</div>
					</div>

					<div className="space-y-4">
						{pendingBookings.map((booking) => (
							<div
								key={booking.id}
								className="border-l-4 border-amber-400 bg-white p-4 shadow-sm"
							>
								<div className="mb-3 flex items-start justify-between">
									<div>
										<div className="mb-1 flex items-center gap-2">
											<Icon name="user" className="h-4 w-4 text-slate-600" />
											<span className="font-semibold text-slate-900">
												{booking.user.name || booking.user.username}
											</span>
										</div>
										<div className="space-y-1 text-sm text-slate-600">
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
												<span className="font-semibold text-slate-900">
													৳{booking.totalPrice.toLocaleString()}
												</span>
											</div>
										</div>
									</div>
								</div>

								<div className="flex gap-2">
									<VendorBookingAction
										bookingId={booking.id}
										vendorId={user.vendor?.id!}
									/>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{/* Bookings Section */}
			<section className="container mb-8 md:mb-12">
				<SectionHeader
					title="Booking History"
					iconName="calendar-days"
					description="Your recent and upcoming bookings"
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
				<h2 className="mb-4 text-lg font-semibold md:text-2xl">Your Reviews</h2>

				{user.reviews.length > 0 ? (
					<div className="space-y-4">
						{user.reviews.map((review) => (
							<div key={review.id} className="bg-muted/20 rounded-lg p-4">
								<div className="mb-2 flex items-center justify-between">
									<Link
										to={`/vendors/${review.vendor.slug}`}
										className="text-sm font-medium hover:underline md:text-lg"
									>
										{review.vendor.businessName}
									</Link>
									<div className="flex items-center">
										{[...Array(5)].map((_, i) => (
											<Icon
												name="star"
												key={i}
												className={`h-3.5 w-3.5 ${i < Math.floor(review.rating) ? 'fill-yellow-400 text-yellow-400' : i < review.rating ? 'fill-yellow-400/50 text-yellow-400/50' : 'text-muted'}`}
											/>
										))}
									</div>
								</div>

								<p className="mb-2 text-xs md:text-base">{review.comment}</p>

								<div className="flex items-center justify-between">
									<p className="text-muted-foreground text-xs md:text-base">
										{formatDate(review.createdAt, 'PPP')}
									</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="bg-muted/20 rounded-lg border py-8 text-center">
						<p className="text-muted-foreground text-sm md:text-lg">
							You haven't written any reviews yet.
						</p>
					</div>
				)}
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
	iconName: string
	description: string
}) => {
	return (
		<div className="mb-4 flex items-center gap-3">
			<div className="rounded-lg border border-amber-200 bg-amber-100 p-2 dark:border-amber-800 dark:bg-amber-900">
				<Icon name={iconName as IconName} className="h-5 w-5 text-amber-600" />
			</div>
			<div>
				<h3 className="text-2xl font-bold text-slate-900 md:text-lg dark:text-slate-50">
					{title}
				</h3>
				<p className="text-slate-600 dark:text-slate-400">{description}</p>
			</div>
		</div>
	)
}
