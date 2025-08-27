import { useId } from 'react'
import { Form, useSearchParams, useSubmit } from 'react-router'
import { useDebounce, useIsPending } from '#app/utils/misc.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { StatusButton } from './ui/status-button.tsx'

export function SearchBar({
	status,
	autoFocus = false,
	autoSubmit = false,
}: {
	status: 'idle' | 'pending' | 'success' | 'error'
	autoFocus?: boolean
	autoSubmit?: boolean
}) {
	const id = useId()
	const [searchParams] = useSearchParams()
	const submit = useSubmit()
	const isSubmitting = useIsPending({
		formMethod: 'GET',
		formAction: '/users',
	})

	const handleFormChange = useDebounce(async (form: HTMLFormElement) => {
		await submit(form)
	}, 400)

	return (
		<Form
			method="GET"
			action="/vendors"
			className="flex max-w-2xl flex-wrap items-center justify-center gap-2"
			onChange={(e) => autoSubmit && handleFormChange(e.currentTarget)}
		>
			<div className="flex-1">
				<Label htmlFor={id} className="sr-only">
					Search
				</Label>
				<Input
					type="search"
					name="search"
					id={id}
					className="text-secondary-foreground placeholder:text-muted-foreground h-14 border-white/20 px-6 text-lg font-medium backdrop-blur placeholder:font-normal md:text-xl"
					defaultValue={searchParams.get('search') ?? ''}
					placeholder="Search vendors, venues, or services..."
					autoFocus={autoFocus}
				/>
			</div>
			<div>
				<StatusButton
					type="submit"
					size="lg"
					status={isSubmitting ? 'pending' : status}
					className="flex h-14 w-full items-center justify-center px-8 text-lg font-semibold"
				>
					<span>Find Vendors</span>
				</StatusButton>
			</div>
		</Form>
	)
}
