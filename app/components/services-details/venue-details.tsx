import { FormProvider, getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form } from 'react-router'
import { VenueDetailsSchema } from '#app/routes/vendors+/__vendor-types.ts'
import { type VenueOptions } from '#app/routes/vendors+/onboarding+/details.tsx'
import { useIsPending } from '#app/utils/misc.tsx'
import { type Route } from '../../routes/vendors+/onboarding+/+types/details'
import { CheckboxField } from '../forms'
import { Input } from '../ui/input'
import { StatusButton } from '../ui/status-button'

export function VenueDetails({
	loaderData,
	actionData,
}: {
	loaderData: Route.ComponentProps['loaderData']
	actionData?: Route.ComponentProps['actionData']
}) {
	const isPending = useIsPending()
	const availableOptions = loaderData.availableOptions as VenueOptions
	const vendor = loaderData.vendor

	const [form, fields] = useForm({
		id: 'services-form',
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VenueDetailsSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<input type="hidden" name="vendorId" value={vendor.id} />
				<div className="space-y-8">
					<div>
						<h2 className="text-2xl font-bold">
							Select the services you offer
						</h2>

						<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
							{availableOptions.services.map((service) => {
								const isChecked = !!vendor.venueDetails?.services?.some(
									(s) => s.globalService.id === service.id,
								)
								return (
									<div key={service.id} className="space-y-2">
										<CheckboxField
											labelProps={{ children: service.name }}
											buttonProps={{
												name: service.name,
												form: form.id,
												value: service.id,
												defaultChecked: isChecked,
											}}
											errors={fields.services.errors}
											className="mb-2"
										/>

										<Input
											form={form.id}
											name={`${service.name}-input`}
											placeholder="Price"
											type="number"
											defaultValue={
												isChecked
													? (vendor.venueDetails?.services?.find(
															(s) => s.globalService.id === service.id,
														)?.price ?? '')
													: ''
											}
										/>

										<Input
											form={form.id}
											name={`${service.name}-description`}
											placeholder="Description"
											type="text"
											defaultValue={
												isChecked
													? (vendor.venueDetails?.services?.find(
															(s) => s.globalService.id === service.id,
														)?.description ?? '')
													: ''
											}
										/>
									</div>
								)
							})}
						</div>
					</div>
				</div>

				<div className="mt-8 flex justify-end">
					<StatusButton
						type="submit"
						disabled={isPending}
						size="wide"
						status={isPending ? 'pending' : 'idle'}
					>
						<span>Next</span>
					</StatusButton>
				</div>
			</Form>
		</FormProvider>
	)
}
