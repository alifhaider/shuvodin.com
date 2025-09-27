import { type Intent, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { formatDate } from 'date-fns'
import { data, useFetcher } from 'react-router'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireVendorId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { type Route } from './+types/vendor-booking-action'

const BookingDeclineSchema = z.object({
	bookingId: z.string(),
	vendorId: z.string(),
})

function CreateBookingAcceptSchema(
	intent: Intent | null,
	options?: {
		checkVendorBookingLimit: (
			bookingId: string,
			vendorId: string,
		) => Promise<boolean>
	},
) {
	return z
		.object({
			bookingId: z.string(),
			vendorId: z.string(),
		})
		.pipe(
			z
				.object({
					bookingId: z.string(),
					vendorId: z.string(),
				})
				.superRefine(async (data, ctx) => {
					const isValidatingBooking =
						intent === null ||
						(intent.type === 'validate' && intent.payload.name === 'bookingId')
					if (!isValidatingBooking) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: 'Booking validation process is not properly initiated.',
						})
						return
					}

					if (typeof options?.checkVendorBookingLimit !== 'function') {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: 'Booking validation function is not provided.',
						})
						return
					}

					try {
						const exceedsLimit = await options.checkVendorBookingLimit(
							data.bookingId,
							data.vendorId,
						)

						if (exceedsLimit) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								path: ['form'],
								message:
									'This vendor has already reached the booking limit for the selected date.',
							})
						}
					} catch (error) {
						if (error instanceof Error) {
							ctx.addIssue({
								path: ['form'],
								code: z.ZodIssueCode.custom,
								message: 'Failed to validate booking due to a server error.',
								fatal: true,
							})
						}
					}
				}),
		)
}

export async function action({ request }: Route.ActionArgs) {
	await requireVendorId(request)
	const formData = await request.formData()
	const { _action } = Object.fromEntries(formData)

	async function declineBooking(formData: FormData) {
		const submission = parseWithZod(formData, { schema: BookingDeclineSchema })

		if (submission.status !== 'success') {
			return data(
				{ success: false, result: submission.reply() },
				{
					headers: await createToastHeaders({
						title: 'Failed to cancel booking',
						description: 'There was an error with your submission.',
						type: 'error',
					}),
				},
			)
		}

		const { bookingId, vendorId } = submission.value

		await prisma.booking.delete({
			where: {
				id: bookingId,
				vendorId: vendorId,
			},
		})

		return data(
			{ success: true, result: 'Booking cancelled successfully.' },
			{
				headers: await createToastHeaders({
					title: 'Booking Cancelled',
					description: 'Your booking has been cancelled successfully.',
					type: 'success',
				}),
			},
		)
	}

	async function acceptBooking(formData: FormData) {
		const submission = parseWithZod(formData, {
			schema: CreateBookingAcceptSchema(null, {
				checkVendorBookingLimit: async (bookingId, vendorId) => {
					// Get the booking date
					const bookingDate = await prisma.booking.findUnique({
						where: { id: bookingId },
						select: { date: true },
					})
					if (!bookingDate) return false

					// Count confirmed bookings on the same date for this vendor
					const existingCount = await prisma.booking.count({
						where: {
							vendorId,
							date: bookingDate.date,
							status: 'confirmed',
						},
					})

					// Fetch vendor limit
					const vendor = await prisma.vendor.findUnique({
						where: { id: vendorId },
						select: { dailyBookingLimit: true },
					})

					return existingCount >= (vendor?.dailyBookingLimit ?? 1)
				},
			}),
		})

		if (submission.status !== 'success') {
			return data(
				{ success: false, result: submission.reply() },
				{
					headers: await createToastHeaders({
						title: 'Failed to accept booking',
						description: 'There was an error with your submission.',
						type: 'error',
					}),
				},
			)
		}

		const { bookingId } = submission.value
		const acceptedBooking = await prisma.booking.update({
			where: { id: bookingId },
			data: { status: 'confirmed' },
			select: { date: true },
		})

		return data(
			{ success: true, result: 'Booking confirmed successfully.' },
			{
				headers: await createToastHeaders({
					title: 'Booking Confirmed',
					description: `Now you got a new booking on ${formatDate(acceptedBooking.date, 'dd MMM, yyyy')}.`,
					type: 'success',
				}),
			},
		)
	}

	switch (_action) {
		case 'cancelBooking': {
			return declineBooking(formData)
		}
		case 'acceptBooking': {
			return acceptBooking(formData)
		}
		default: {
			return data(
				{ success: false, result: {} },
				{
					status: 400,
					headers: await createToastHeaders({
						title: 'Invalid Action',
						description: 'The action you attempted is not recognized.',
						type: 'error',
					}),
				},
			)
		}
	}
}

export function VendorBookingAction({
	bookingId,
	vendorId,
	actionData,
}: {
	bookingId: string
	vendorId: string
	actionData?: Route.ComponentProps['actionData']
}) {
	const declineBookingFetcher = useFetcher()
	const acceptBookingFetcher = useFetcher()

	const [declineBookingForm] = useForm({
		id: 'decline-booking-form',
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: BookingDeclineSchema })
		},
		shouldRevalidate: 'onBlur',
	})
	return (
		<div className="flex items-center gap-6">
			<declineBookingFetcher.Form
				method="post"
				className="inline"
				action="/vendor-booking-action"
			>
				<input type="hidden" name="bookingId" value={bookingId} />
				<input type="hidden" name="vendorId" value={vendorId} />
				<StatusButton
					status={
						declineBookingFetcher.state !== 'idle' ? 'pending' : 'success'
					}
					type="submit"
					name="_action"
					value="cancelBooking"
					size="sm"
					variant="destructive"
				>
					Decline
				</StatusButton>
			</declineBookingFetcher.Form>
			<acceptBookingFetcher.Form
				method="post"
				className="ml-2 inline"
				action="/vendor-booking-action"
			>
				<input type="hidden" name="bookingId" value={bookingId} />
				<StatusButton
					status={acceptBookingFetcher.state !== 'idle' ? 'pending' : 'success'}
					type="submit"
					name="_action"
					value="acceptBooking"
					size="sm"
				>
					Accept
				</StatusButton>
			</acceptBookingFetcher.Form>
			<ErrorList errors={declineBookingForm.errors} />
			<ErrorList errors={acceptBookingFetcher.data?.errors} />
		</div>
	)
}
