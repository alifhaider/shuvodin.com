import { FormProvider, getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form } from 'react-router'
import { VenueServicesForm } from '#app/components/ui/services-forms/venue-services.tsx'
import { useIsPending } from '#app/utils/misc.tsx'
import { VendorDetailsSchema } from './__vendor-types'
import { type Route } from './onboarding+/+types/details'

export function ServicesEditor({
	loaderData,
	actionData,
}: {
	loaderData: Route.ComponentProps['loaderData']
	actionData?: Route.ComponentProps['actionData']
}) {
	const isPending = useIsPending()
	const availableOptions = loaderData.availableOptions

	const [form, fields] = useForm({
		id: 'services-form',
		constraint: getZodConstraint(VendorDetailsSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VendorDetailsSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const renderFormByVendorType = () => {
		switch (loaderData.vendorType.name) {
			case 'venue':
				return <VenueServicesForm fields={fields} loaderData={loaderData} />
			//   case 'makeup-artist':
			//     return <MakeupServicesForm fields={fields} existingData={existingData} />
			// Add other vendor types
			default:
				return <div>Unknown vendor type</div>
		}
	}

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				{renderFormByVendorType()}
				<button type="submit">Save Services</button>
			</Form>
		</FormProvider>
	)
}
