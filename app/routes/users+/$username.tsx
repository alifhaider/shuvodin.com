import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { formatDate } from 'date-fns'
import { data, Link, useFetcher } from 'react-router'
import { z } from 'zod'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Progress } from '#app/components/ui/progress.tsx'
import { getUserId, requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { type Route } from './+types/$username'

const getStatusColor = (status: string) => {
	switch (status) {
		case 'confirmed':
			return 'bg-green-100 text-green-800 border-green-200'
		case 'pending':
			return 'bg-yellow-100 text-yellow-800 border-yellow-200'
		case 'completed':
			return 'bg-blue-100 text-blue-800 border-blue-200'
		case 'cancelled':
			return 'bg-red-100 text-red-800 border-red-200'
		default:
			return 'bg-gray-100 text-gray-800 border-gray-200'
	}
}

const getStatusIcon = (status: string) => {
	switch (status) {
		case 'confirmed':
			return <Icon name="circle-check" className="h-3 w-3" />
		case 'pending':
			return <Icon name="clock" className="h-3 w-3" />
		case 'completed':
			return <Icon name="circle-check" className="h-3 w-3" />
		case 'cancelled':
			return <Icon name="x" className="h-3 w-3" />
		default:
			return <Icon name="circle-alert" className="h-3 w-3" />
	}
}

export const meta = ({ data }: Route.MetaArgs) => {
	return [
		{ title: `${data?.user.username} / DB` },
		{
			name: 'description',
			content: `Daktar Bari ${data?.user.username} Profile!`,
		},
	]
}

const ReviewSchema = z.object({
	rating: z
		.number({ message: 'Please provide a rating' })
		.int({ message: 'Rating must be a whole number' })
		.min(1, 'Rating must be between 1 and 5')
		.max(5, 'Rating must be between 1 and 5'),
	doctorId: z.string(),
	userId: z.string(),
	comment: z.string().min(10, 'Comment must be at least 10 characters'),
})

export async function loader({ request, params }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const page = url.searchParams.get('page')
	const user = await prisma.user.findFirst({
		include: {
			reviews: {
				orderBy: { createdAt: 'desc' },
				take: 3,
				skip: page ? (Number(page) - 1) * 3 : 0,
				select: {
					id: true,
					rating: true,
					comment: true,
					createdAt: true,
					vendor: {
						select: { businessName: true, slug: true },
					},
				},
			},
			vendor: {
				select: {
					id: true,
					slug: true,
					businessName: true,
					rating: true,
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
	const totalReviewsCount = user._count.reviews
	const totalFavorites = user._count.favorites
	const totalBookings = user._count.bookings
	return {
		user,
		userJoinedDisplay: user.createdAt.toLocaleDateString(),
		totalReviewsCount,
		totalFavorites,
		totalBookings,
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

export default function DoctorRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const {
		isVendor,
		user,
		userJoinedDisplay,

		totalBookings,
		totalFavorites,
		totalReviewsCount,
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
	return (
		<main className="container py-6">
			{/* User Header */}
			<div className="mb-6 flex flex-col items-start justify-between md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<div className="bg-primary text-primary-foreground flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold">
						{initials}
					</div>
					<div>
						<h1 className="text-2xl font-bold">{user.name}</h1>
						<div className="text-muted-foreground flex items-center gap-2 text-sm md:text-lg">
							<Icon name="calendar-days" className="h-3.5 w-3.5" />
							<span>Joined {userJoinedDisplay}</span>
							<span className="mx-1">•</span>
							<Icon name="star" className="h-3.5 w-3.5" />
							<span>{totalReviewsCount} reviews</span>
						</div>
					</div>
				</div>
				<Button
					asChild
					size="sm"
					variant="outline"
					className="mt-4 bg-transparent md:mt-0"
				>
					<Link to="/profile/settings">
						<Icon name="settings" className="mr-1.5 h-3.5 w-3.5" />
						Settings
					</Link>
				</Button>
			</div>

			{/* Vendor Section (if user is a vendor) */}
			{isVendor && (
				<div className="from-primary/10 to-primary/5 relative mb-8 overflow-hidden rounded-lg border bg-gradient-to-r p-4">
					<div className="flex flex-col justify-between md:flex-row md:items-center">
						<div>
							<div className="flex items-center gap-2">
								<Badge
									variant="outline"
									className="bg-primary/10 text-xs font-medium md:text-base"
								>
									Vendor
								</Badge>
								<h2 className="text-lg font-semibold md:text-2xl">
									{user.vendor?.businessName}
								</h2>
							</div>

							<div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3">
								<div>
									<p className="text-muted-foreground text-xs md:text-base">
										Listings
									</p>
									<p className="text-sm font-medium md:text-lg">3</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs md:text-base">
										Rating
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
			)}

			{/* Bookings Section */}
			<div className="mb-8">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold md:text-2xl">Your Bookings</h2>
					<Link
						to="/bookings"
						className="text-primary text-xs hover:underline md:text-base"
					>
						View all
					</Link>
				</div>

				{user.bookings.length > 0 ? (
					<div className="space-y-4">
						{user.bookings.map((booking) => (
							<div
								key={booking.id}
								className="border-muted relative border-l-2 pl-6"
							>
								{/* Status indicator */}
								<div
									className={`absolute top-0 left-[-5px] h-2.5 w-2.5 rounded-full ${getStatusColor(booking.status)}`}
								/>

								<div className="flex flex-col justify-between pb-4 md:flex-row md:items-center">
									<div>
										<div className="flex items-center gap-2">
											<h3 className="text-sm font-medium md:text-lg">
												{booking.vendor.businessName}
											</h3>
											<Badge
												variant={
													booking.status === 'completed'
														? 'secondary'
														: booking.status === 'upcoming'
															? 'outline'
															: 'destructive'
												}
												className="text-xs md:text-base"
											>
												{booking.status.charAt(0).toUpperCase() +
													booking.status.slice(1)}
											</Badge>
										</div>

										<div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-base">
											<div className="flex items-center gap-1">
												<Icon name="calendar-days" className="h-3 w-3" />
												<span>{formatDate(booking.date, 'PPP')}</span>
											</div>
										</div>
									</div>

									<div className="mt-2 flex items-center gap-2 md:mt-0">
										<p className="text-sm font-medium md:text-lg">
											৳{booking.totalPrice.toLocaleString()}
										</p>
										{booking.status === 'upcoming' && (
											<CancelBookingButton
												bookingId={booking.id}
												actionData={actionData}
											/>
										)}
										<Button
											size="sm"
											variant="outline"
											className="h-7 bg-transparent text-xs md:text-base"
											asChild
										>
											<Link to={`/vendors/${booking.vendor.slug}`}>
												View Vendor
											</Link>
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="bg-muted/20 rounded-lg border py-8 text-center">
						<p className="text-muted-foreground text-sm md:text-lg">
							You don't have any bookings yet.
						</p>
						<Button asChild size="sm" className="mt-2">
							<Link to="/vendors">Browse Vendors</Link>
						</Button>
					</div>
				)}
			</div>

			{/* Reviews Section */}
			<div>
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
			</div>
		</main>
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
