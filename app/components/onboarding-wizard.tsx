import {
	GallerySchema,
	GeneralInfoSchema,
	LinksSchema,
	ServicesSchema,
	VenueDetailsSchema,
} from '#app/routes/vendors+/onboarding.tsx'
import { FormProvider, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { GeneralStep } from './onbaording-steps/general-step'

interface OnboardingWizardProps {
	currentStep: number
	onNext: () => void
	onPrevious: () => void
	formData: any
	onUpdate: (data: any) => void
}

export function OnboardingWizard({
	currentStep,
	onPrevious,
	formData,
	onUpdate,
}: OnboardingWizardProps) {
	const [form, fields] = useForm({
		id: 'onboarding-form',
		defaultValue: formData,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	const getStepSchema = () => {
		switch (currentStep) {
			case 1:
				return GeneralInfoSchema
			case 2:
				return LinksSchema
			case 3:
				return GallerySchema
			case 4:
				return ServicesSchema
			case 5:
				return VenueDetailsSchema
			default:
				return GeneralInfoSchema
		}
	}

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault()
		const formData = new FormData(event.currentTarget as HTMLFormElement)
		const submission = parseWithZod(formData, { schema: getStepSchema() })

		if (submission.status === 'success') {
			onUpdate(submission.value)
		}
	}

	return (
		<FormProvider context={form.context}>
			<form
				id={form.id}
				onSubmit={handleSubmit}
				className="space-y-6"
				encType="multipart/form-data"
			>
				{currentStep === 1 && <GeneralStep fields={fields} />}
				{currentStep === 2 && <p>Links Step (to be implemented)</p>}
				{/* {currentStep === 3 && <GalleryStep fields={fields} />}
				{currentStep === 4 && <ServicesStep fields={fields} />}
				{currentStep === 5 && <VenueDetailsStep fields={fields} />} */}

				<div className="flex justify-between">
					{currentStep > 1 && (
						<button
							type="button"
							onClick={onPrevious}
							className="rounded bg-gray-300 px-4 py-2"
						>
							Previous
						</button>
					)}

					<button
						type="submit"
						className="rounded bg-blue-500 px-4 py-2 text-white"
					>
						{currentStep === 5 ? 'Complete' : 'Next'}
					</button>
				</div>
			</form>
		</FormProvider>
	)
}
