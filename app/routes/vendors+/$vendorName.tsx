import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import clsx from 'clsx'
import { format } from 'date-fns'
import { Img } from 'openimg/react'
import * as React from 'react'
import { data, Form, Link, useNavigation } from 'react-router'
import { z } from 'zod'
import Breadcrumb from '#app/components/breadcrumb.tsx'
import { ErrorList, TextareaField } from '#app/components/forms.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Separator } from '#app/components/ui/separator.tsx'
import {
	getUserFavoriteVendorIds,
	getUserId,
	requireUserId,
} from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getVendorImgSrc } from '#app/utils/misc.tsx'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { FavoriteVendorForm } from '../resources+/favorite-vendor-form'
import { type Route } from './+types/$vendorName'

export const meta: Route.MetaFunction = ({ data }) => {
	return [
		{
			title: data?.vendor?.businessName
				? `${data?.vendor.businessName} / ShuvoDin`
				: 'Vendor / ShuvoDin',
		},
	]
}

const ReviewSchema = z.object({
	rating: z
		.number({ message: 'Please provide a rating' })
		.int({ message: 'Rating must be a whole number' })
		.min(1, 'Rating must be between 1 and 5')
		.max(5, 'Rating must be between 1 and 5'),
	vendorId: z.string(),
	userId: z.string(),
	comment: z.string().min(5, 'Comment must be at least 5 characters'),
})

export async function loader({ params, request }: Route.LoaderArgs) {
	const { vendorName } = params
	const loggedInUserId = await getUserId(request)

	const searchParams = new URL(request.url).searchParams
	const reviewPage = parseInt(searchParams.get('reviewPage') || '1', 10)
	const reviewsPerPage = 5
	const reviewOffset = (reviewPage - 1) * reviewsPerPage

	const vendor = await prisma.vendor.findUnique({
		where: { slug: vendorName },
		include: {
			vendorType: { select: { slug: true, name: true } },
			gallery: { take: 4, select: { objectKey: true, altText: true } },
			owner: {
				select: {
					name: true,
					image: { select: { objectKey: true, altText: true } },
				},
			},
			venueDetails: {
				select: {
					eventTypes: {
						select: { globalEventType: { select: { id: true, name: true } } },
					},
					amenities: {
						select: { globalAmenity: { select: { id: true, name: true } } },
					},
					services: {
						select: {
							globalService: { select: { id: true, name: true } },
							description: true,
							price: true,
						},
					},
					spaces: {
						select: {
							globalSpace: { select: { id: true, name: true } },
							sittingCapacity: true,
							standingCapacity: true,
							parkingCapacity: true,
							price: true,
							description: true,
						},
					},
				},
			},

			packages: { select: { title: true, description: true, price: true } },
			_count: {
				select: {
					favorites: true,
					gallery: true,
					bookings: true,
					reviews: true,
				},
			},
			reviews: {
				select: {
					id: true,
					rating: true,
					comment: true,
					user: { select: { username: true, name: true } },
					createdAt: true,
				},
				take: reviewsPerPage,
				skip: reviewOffset,
				orderBy: { createdAt: 'desc' },
			},
		},
	})

	invariantResponse(vendor, 'Vendor not found', { status: 404 })
	const favoriteVendorIds = await getUserFavoriteVendorIds(request)

	return {
		vendor,
		loggedInUserId,
		isFavorited: favoriteVendorIds.includes(vendor.id),
	}
}

export async function action({ request }: Route.ActionArgs) {
	await requireUserId(request)
	const formData = await request.formData()
	const { _action } = Object.fromEntries(formData)

	async function createReview(formData: FormData) {
		const submission = parseWithZod(formData, { schema: ReviewSchema })

		if (submission.status !== 'success') {
			return data(
				{ success: false, result: submission.reply() },
				{
					headers: await createToastHeaders({
						description: 'There was an error creating the review',
						type: 'error',
					}),
				},
			)
		}

		const { vendorId, userId, comment, rating } = submission.value

		await prisma.review.create({
			data: {
				rating,
				comment,
				vendorId,
				userId,
			},
		})

		// Recalculate the vendor's average rating
		const vendor = await prisma.vendor.findUnique({
			where: { id: vendorId },
			select: { _count: { select: { reviews: true } } },
		})

		const totalReviews = vendor?._count.reviews || 0

		const reviews = await prisma.review.findMany({
			where: { vendorId },
			select: { rating: true },
		})

		const averageRating =
			reviews.reduce((acc, review) => acc + review.rating, 0) /
			(totalReviews || 1)

		const newRating = Math.round(averageRating * 10) / 10 // Round to 1 decimal place

		await prisma.vendor.update({
			where: { id: vendorId },
			data: {
				rating: {
					set: newRating,
				},
			},
		})

		return data(
			{ success: true, result: submission.reply() },
			{
				headers: await createToastHeaders({
					description: 'Thanks for sharing your feedback!',
					type: 'success',
				}),
			},
		)
	}

	switch (_action) {
		case 'create-review':
			return createReview(formData)

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

export default function VendorsPage({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { vendor, loggedInUserId, isFavorited } = loaderData

	return (
		<>
			<section className="from-primary/10 via-accent/5 to-secondary/10 relative bg-gradient-to-r py-6">
				<div className="container">
					<Breadcrumb
						items={[
							{ to: '/', label: 'Home' },
							{ to: '/vendors', label: 'Vendors' },
							{
								to: `/vendors?vendorType=${vendor.vendorType.slug}`,
								label: vendor.vendorType.name,
							},
							{
								to: `/vendors/${vendor.slug}`,
								label: vendor.businessName,
								isCurrent: true,
							},
						]}
					/>
					<Gallery gallery={vendor.gallery} uniqueName={vendor.slug} />
					<div className="flex justify-between gap-6 py-12">
						<div className="mr-6 flex-1">
							<h1 className="font-serif text-4xl font-bold capitalize lg:text-5xl">
								{vendor.businessName}
							</h1>

							<p className="mt-4 flex items-center gap-2 text-base font-semibold">
								<Icon name="map-pin" className="inline h-4 w-4" />
								{vendor.address}, {vendor?.thana}, {vendor?.district},{' '}
								{vendor?.division}
							</p>

							<div className="mt-3 flex items-end gap-[1px]">
								{Array.from({ length: 5 }, (_, index) => (
									<Icon
										key={index}
										name="star"
										className={clsx(
											'h-6 w-6',
											index < vendor.rating
												? 'fill-yellow-500 text-yellow-500'
												: 'text-gray-300',
										)}
									/>
								))}
								<span className="ml-1 text-xl font-bold">
									{vendor.rating.toFixed(1)}
								</span>
								<span className="text-muted-foreground mb-0.5 ml-1 text-sm">
									{' '}
									({vendor._count.reviews} reviews)
								</span>
							</div>

							<Separator className="my-6" />

							<h5 className="mb-2 text-lg font-extrabold md:mb-3 md:text-2xl">
								About this <strong>{vendor.vendorType.name}</strong>
							</h5>

							<p className="text-muted-foreground max-w-full text-base md:max-w-2xl md:text-lg">
								{vendor.description}
							</p>

							<Spacer size="2xs" />

							{vendor.vendorType.name === 'venue' ? (
								<VenueDetails venue={vendor.venueDetails} />
							) : null}

							<Spacer size="xs" />

							<Separator className="my-6" />

							<Reviews
								reviews={vendor.reviews ?? []}
								vendorId={vendor.id}
								actionData={actionData}
								userId={loggedInUserId}
								totalReviews={vendor._count?.reviews}
								overallRating={vendor.rating}
							/>
						</div>
						<div className="border-accent sticky top-20 inline-block h-full w-full rounded-2xl border bg-gray-50 p-6 shadow-sm transition-all md:w-1/4 dark:bg-gray-800">
							<h4 className="text-2xl font-extrabold">
								Want them for your wedding?
							</h4>

							<div className="mt-4 flex items-center gap-4 font-medium">
								<Button className="h-14 w-full rounded-full text-xl whitespace-nowrap">
									Get Quote
								</Button>

								<button className="border-primary text-primary hover:text-secondary-foreground hover:bg-accent flex aspect-square h-14 cursor-pointer items-center justify-center rounded-full border p-2">
									<Icon name="share" className="h-5 w-5" />
									<span className="sr-only">Share</span>
								</button>

								<FavoriteVendorForm
									vendorId={vendor.id}
									isFavorited={isFavorited}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	)
}

const Gallery = ({
	gallery,
	uniqueName,
}: {
	gallery: { objectKey: string; altText: string | null }[]
	uniqueName: string
}) => {
	if (!gallery || gallery.length === 0) {
		return (
			<p className="text-muted-foreground border-muted-foreground mt-6 flex min-h-96 items-center justify-center rounded-2xl border">
				No images available
			</p>
		)
	}
	const slicedImages = gallery.slice(0, 4)
	const hasMoreImages = gallery.length > 4
	if (slicedImages.length === 0) return <p>No images available</p>
	return (
		<Link
			to={`/vendors/${uniqueName}/gallery`}
			className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-[55%_20%_25%] md:grid-rows-2"
		>
			{slicedImages.map((image, index) => (
				<div
					className={clsx('relative h-full w-full rounded-lg object-cover', {
						'row-span-2 max-h-96': index === 0 || index === 2,
						'max-h-46': index === 1 || index === 3,
					})}
					key={index}
				>
					<Img
						loading="lazy"
						placeholder="blur"
						height={index === 0 || index === 2 ? 400 : 200}
						width={index === 0 || index === 2 ? 600 : 300}
						src={getVendorImgSrc(image.objectKey)}
						alt={image.altText || `${uniqueName} Gallery Image ${index + 1}`}
						className="h-full w-full rounded-lg object-cover"
					/>
					{hasMoreImages && index === 2 && (
						<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 px-2 py-1 text-white">
							<span className="rounded-lg bg-black/50 px-4 py-2">
								View All{' '}
								<span className="text-sm">({gallery.length - 4} More)</span>
							</span>
						</div>
					)}
				</div>
			))}
		</Link>
	)
}

type VenueDetailsProps = {
	venue: Route.ComponentProps['loaderData']['vendor']['venueDetails']
}

const VenueDetails = ({ venue }: VenueDetailsProps) => {
	return (
		<>
			<h4 className="mb-4 text-lg font-extrabold md:text-2xl">Event Spaces</h4>
			<Accordion
				type="single"
				collapsible
				className="w-full space-y-6"
				defaultValue="item-1"
			>
				{venue?.spaces.map((space) => {
					return (
						<AccordionItem
							value={`space-${space.globalSpace.id}`}
							key={space.globalSpace.id}
							className="border-primary/30 bg-background mb-4 rounded-2xl border px-6 py-4 shadow-sm"
						>
							<AccordionTrigger>
								<h5 className="font-body flex-1 text-base">
									{space.globalSpace.name}
								</h5>
								{Number(space.price) === 0 ? (
									<p>Includes in Total Price</p>
								) : (
									<p className="font-body text-base">
										TK: <span className="font-bold">{space.price}/-</span>
									</p>
								)}
							</AccordionTrigger>
							<AccordionContent className="bg-accent/50 mt-4 grid grid-cols-3 gap-4 rounded-lg px-6 py-4">
								<div className="text-secondary-foreground flex flex-col items-center gap-2 text-sm md:text-lg">
									<Icon name="sofa" className="h-6 w-6" />
									<span className="sr-only">Sitting Capacity</span>
									<span>{space.sittingCapacity} Capacity</span>
								</div>
								<div className="text-secondary-foreground flex flex-col items-center gap-2 text-sm md:text-lg">
									<Icon name="person-standing" className="h-6 w-6" />
									<span className="sr-only">Standing Capacity</span>
									<span>{space.standingCapacity} Capacity</span>
								</div>
								<div className="text-secondary-foreground flex flex-col items-center gap-2 text-sm md:text-lg">
									<Icon name="car-front" className="h-6 w-6" />
									<span className="sr-only">Parking Capacity</span>
									<span>{space.parkingCapacity || 'N/A'} Parking</span>
								</div>
							</AccordionContent>
							{space.description && (
								<p className="text-muted-foreground mt-1 text-sm">
									<strong>Description: </strong>
									{space.description}
								</p>
							)}
						</AccordionItem>
					)
				})}
			</Accordion>

			<Spacer size="2xs" />

			<h4 className="mb-4 text-lg font-extrabold md:text-2xl">
				Services Offered
			</h4>
			{venue?.services && venue.services.length > 0 ? (
				<ul className="border-primary/30 divide-accent bg-background mb-4 divide-y rounded-2xl border px-6 py-4 shadow-sm">
					{venue?.services.map((service) => (
						<li
							key={service.globalService.id}
							className="not-last:mb-4 first:pb-4"
						>
							<span className="flex justify-between text-sm md:text-base">
								<span className="font-medium">
									{service.globalService.name}
								</span>
								<span className="font-bold">TK: {service.price}/-</span>
							</span>
							<span className="text-muted-foreground text-xs md:text-sm">
								{service.description}
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className="text-muted-foreground mb-4 text-base md:text-lg">
					No services available
				</p>
			)}

			<Spacer size="2xs" />

			<h4 className="mb-4 text-lg font-extrabold md:text-2xl">
				Venue Amenities
			</h4>

			{venue?.amenities && venue.amenities.length > 0 ? (
				<ul className="border-primary/30 bg-background divide-accent mb-4 grid grid-cols-2 gap-4 divide-x rounded-2xl border px-6 py-4 text-base shadow-sm md:grid-cols-3 md:text-lg lg:grid-cols-4">
					{venue?.amenities.map((amenity) => (
						<li key={amenity.globalAmenity.id} className="">
							<Icon
								name="check"
								className="text-primary inline h-4 w-4 stroke-2 md:h-5 md:w-5"
							/>
							<span className="ml-2">{amenity.globalAmenity.name}</span>
						</li>
					))}
				</ul>
			) : (
				<p className="text-muted-foreground mb-4 text-base md:text-lg">
					No amenities available
				</p>
			)}

			<Spacer size="2xs" />

			<h4 className="mb-4 text-lg font-extrabold md:text-2xl">Available For</h4>

			{venue?.eventTypes && venue.eventTypes.length > 0 ? (
				<ul className="border-primary/30 bg-background divide-accent mb-4 grid grid-cols-2 gap-4 divide-x rounded-2xl border px-6 py-4 text-base shadow-sm md:grid-cols-3 md:text-lg lg:grid-cols-4">
					{venue?.eventTypes.map((eventType) => (
						<li key={eventType.globalEventType.id} className="">
							<Icon
								name="check"
								className="text-primary inline h-4 w-4 stroke-2 md:h-5 md:w-5"
							/>
							<span className="ml-2">{eventType.globalEventType.name}</span>
						</li>
					))}
				</ul>
			) : (
				<p className="text-muted-foreground mb-4 text-base md:text-lg">
					No event types available
				</p>
			)}
		</>
	)
}

type ReviewProps = {
	reviews: Route.ComponentProps['loaderData']['vendor']['reviews']
	vendorId: string
	userId: string | null
	totalReviews: number
	actionData: any
	overallRating: number | null
}

const Reviews = ({
	reviews,
	vendorId,
	userId,
	totalReviews,
	actionData,
	overallRating,
}: ReviewProps) => {
	const $form = React.useRef<HTMLFormElement>(null)
	let navigation = useNavigation()
	const [form, fields] = useForm({
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ReviewSchema })
		},
		shouldRevalidate: 'onSubmit',
	})

	React.useEffect(
		function resetFormOnSuccess() {
			if (navigation.state === 'idle' && actionData?.success) {
				$form.current?.reset()
			}
		},
		[navigation.state, actionData],
	)

	if (!reviews) return null

	return (
		<section>
			<h4 className="text-sm font-extrabold">RATINGS AND REVIEWS</h4>

			<div>
				<p className="flex items-center gap-2 text-6xl font-extrabold">
					{overallRating || 0}
					<span>
						<Icon name="star" className="fill-priamry text-primary h-6 w-6" />
					</span>
				</p>

				<p className="mt-1 text-sm">
					&#40;
					{totalReviews} {Number(totalReviews) > 1 ? 'Ratings' : 'Rating'}&#41;
				</p>
			</div>

			<Spacer size="xs" />

			<h6 className="text-secondary-foreground text-sm font-extrabold uppercase md:text-lg lg:text-xl">
				Reviews from Users
			</h6>
			{reviews.length === 0 ? (
				<p className="text-accent-foreground text-sm">
					No reviews yet. Be the first to share your experience!
				</p>
			) : null}
			<ul className="max-w-4xl space-y-6 py-2">
				{reviews.map((review) => (
					<li key={review.id} className="flex items-start gap-4 first:pt-0">
						<div className="flex-1 space-y-2">
							<div className="flex gap-0.5">
								{Array.from({ length: 5 }, (_, i) => (
									<span key={i}>
										<Icon
											name="star"
											className={`h-5 w-5 fill-transparent text-gray-300 ${review.rating > i ? 'fill-primary text-primary' : ''}`}
										/>
									</span>
								))}
							</div>
							<p className="font-montserrat text-secondary-foreground text-xs font-semibold">
								{review.user.name || review.user.username}
								<span className="text-muted-foreground ml-2 text-[11px] font-medium">
									{format(review.createdAt, 'MMMM d, yyyy')}
								</span>
							</p>

							<p className="text-secondary-foreground text-sm">
								{review.comment}
							</p>
						</div>
					</li>
				))}
			</ul>

			<Spacer size="md" />
			<div className="flex max-w-4xl items-center justify-center">
				<Button asChild size="default">
					<Link to="/reviews">See More</Link>
				</Button>
			</div>

			<Spacer size="md" />

			<h6 className="text-secondary-foreground text-lg font-extrabold uppercase">
				Write a Review
			</h6>

			<Spacer size="3xs" />

			{!userId ? (
				<p className="text-secondary-foreground text-sm">
					Please{' '}
					<Link to="/login" className="text-primary underline">
						Login
					</Link>{' '}
					to write a review.
				</p>
			) : (
				<section id="write-review">
					<Form method="post" {...getFormProps(form)} ref={$form}>
						<input
							{...getInputProps(fields.vendorId, { type: 'hidden' })}
							value={vendorId}
						/>
						<input
							{...getInputProps(fields.userId, { type: 'hidden' })}
							value={userId || ''} // Ensure userId is a string, even if null
						/>
						<Label htmlFor={fields.rating.id} className="text-sm font-semibold">
							Rating
						</Label>
						<div className="flex gap-2">
							{[1, 2, 3, 4, 5].map((star) => (
								<label key={star} className="cursor-pointer">
									<input
										{...getInputProps(fields.rating, { type: 'radio' })}
										value={star}
										className="peer sr-only"
									/>
									<Icon
										name="star"
										className={`h-8 w-8 ${star <= Number(fields.rating.value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'} transition-colors duration-150`}
									/>
								</label>
							))}
						</div>
						<ErrorList errors={fields.rating.errors} />
						<Spacer size="3xs" />

						<TextareaField
							labelProps={{ htmlFor: fields.comment.id, children: 'Comment' }}
							textareaProps={{
								...getInputProps(fields.comment, { type: 'text' }),
								autoComplete: 'off',

								rows: 4,
							}}
							errors={fields.comment.errors}
						/>
						<Button type="submit" name="_action" value="create-review">
							Submit
						</Button>
					</Form>
					<ErrorList errors={form.errors} />
				</section>
			)}
		</section>
	)
}
