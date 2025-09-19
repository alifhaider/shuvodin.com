import { VendorLinksForm } from '#app/routes/resources+/vendor-links-form.tsx'
import { requireVendorId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/links'

export async function loader({ request }: Route.LoaderArgs) {
	const vendorId = await requireVendorId(request)
	return { vendorId }
}

export default function OnboardingFinal({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return <VendorLinksForm actionData={actionData} loaderData={loaderData} />
}
