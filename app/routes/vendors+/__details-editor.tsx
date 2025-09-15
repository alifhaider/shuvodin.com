import { VenueDetails } from '#app/components/services-details/venue-details.tsx'
import { type Route } from './onboarding+/+types/details'

export function DetailsEditor({
	loaderData,
	actionData,
}: {
	loaderData: Route.ComponentProps['loaderData']
	actionData?: Route.ComponentProps['actionData']
}) {
	const vendorTypeName = loaderData.vendor.vendorType.name

	return (
		<>
			{vendorTypeName === 'venue' ? (
				<VenueDetails loaderData={loaderData} actionData={actionData} />
			) : (
				<div>Unsupported vendor type: {vendorTypeName}</div>
			)}
		</>
	)
}
