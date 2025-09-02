import {
	getFormProps,
	getInputProps,
	getSelectProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import React from 'react'
import { data, Form, redirect } from 'react-router'
import { z } from 'zod'
import { Field, SelectField, TextareaField } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import {
	divisions,
	getDistrictsForDivision,
	thanaByDistrict,
} from '#app/utils/locations.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { generateSlug } from '#app/utils/slug.server.tsx'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { type Route } from './+types/general'

export const GeneralInfoSchema = z
	.object({
		businessName: z
			.string({ required_error: 'Business Name is Required' })
			.min(3, 'Business name has to be at least 3 characters'),
		vendorTypeId: z
			.string({ required_error: 'Vendor Type is Required' })
			.min(1, 'Select a vendor type'),
		division: z.string({ required_error: 'Division is Required' }),
		district: z.string({ required_error: 'District is Required' }),
		thana: z.string({ required_error: 'Thana is Required' }),
		address: z.string().optional(),
		description: z
			.string()
			.min(10, { message: 'Description must be at least 10 characters long' })
			.max(500, { message: 'Maximum 500 characters allowed' })
			.optional(),
	})
	.strict()

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	const vendorTypes = await prisma.vendorType.findMany({
		select: { id: true, name: true },
		orderBy: { name: 'asc' },
	})
	return { vendorTypes }
}

export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const name = formData.get('businessName') ?? ''

	// business name: Studio by Fariha Borsha
	// primary slug: studio-by-fariha-borsha
	// check if slug exists in db
	// if exists, append a number to the slug
	// in db i have studio-by-fariha-borsha, studio-by-fariha-borsha-1, studio-by-fariha-borsha-2
	// so next slug will be studio-by-fariha-borsha-3

	const submission = parseWithZod(formData, { schema: GeneralInfoSchema })

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

	const {
		businessName,
		vendorTypeId,
		division,
		district,
		thana,
		address,
		description,
	} = submission.value
	const slug = await generateSlug(businessName)

	// await prisma.vendor.create({
	// 	data: {
	// 		businessName,
	// 		slug,
	// 		vendorTypeId,
	// 		division,
	// 		district,
	// 		thana,
	// 		address,
	// 		description,
	// 		ownerId: userId,
	// 	},
	// })

	return redirect('/vendors/onboarding/gallery')
}

export default function OnboardingGeneral({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const isPending = useIsPending()
	const { vendorTypes } = loaderData
	const [selectedDivision, setSelectedDivision] = React.useState('')
	const [selectedDistrict, setSelectedDistrict] = React.useState('')

	const districts = getDistrictsForDivision(selectedDivision)
	const thanas = selectedDistrict ? thanaByDistrict[selectedDistrict] || [] : []

	const [form, fields] = useForm({
		id: 'general-info-form',
		constraint: getZodConstraint(GeneralInfoSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: GeneralInfoSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	console.log(fields.division.errors, fields.division.value)

	return (
		<Form method="post" {...getFormProps(form)}>
			<div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
				<Field
					labelProps={{ children: 'Business Name' }}
					inputProps={{
						autoFocus: true,
						...getInputProps(fields.businessName, { type: 'text' }),
					}}
					errors={fields.businessName.errors}
				/>

				<SelectField
					labelProps={{ children: 'Vendor Type' }}
					selectProps={{
						...getSelectProps(fields.vendorTypeId),
					}}
					options={vendorTypes.map((type) => ({
						value: type.id,
						label: type.name,
					}))}
					errors={fields.vendorTypeId.errors}
				/>

				<SelectField
					labelProps={{ children: 'Division' }}
					selectProps={{
						name: fields.division.name,
						onValueChange: (value) => {
							setSelectedDivision(value)
							setSelectedDistrict('')
							form.update({ name: fields.district.name, value: '' })
							form.update({ name: fields.thana.name, value: '' })
						},
					}}
					options={Object.values(divisions).map((division) => ({
						value: division,
						label: division,
					}))}
					errors={fields.division.errors}
				/>

				<SelectField
					labelProps={{ children: 'District' }}
					selectProps={{
						name: fields.district.name,
						onValueChange: (value) => {
							setSelectedDistrict(value)
							form.update({ name: fields.thana.name, value: '' })
						},
						disabled: !selectedDivision,
					}}
					placeholder={
						!selectedDivision ? 'Select division first' : 'Select district'
					}
					options={districts.map((district) => ({
						value: district,
						label: district,
					}))}
					errors={fields.district.errors}
				/>

				<SelectField
					labelProps={{ children: 'Thana/Upazila' }}
					selectProps={{
						name: fields.thana.name,
						onValueChange: (value) => {
							form.update({ name: fields.thana.name, value: value })
						},
						disabled: !selectedDistrict,
					}}
					options={thanas.map((thana) => ({
						value: thana,
						label: thana,
					}))}
					placeholder={
						!selectedDistrict ? 'Select district first' : 'Select thana/upazila'
					}
					errors={fields.thana.errors}
				/>

				<Field
					labelProps={{ children: 'Address' }}
					inputProps={{
						...getInputProps(fields.address, { type: 'text' }),
					}}
					errors={fields.address.errors}
				/>

				<TextareaField
					labelProps={{ children: 'Description' }}
					textareaProps={{
						...getTextareaProps(fields.description),
					}}
					errors={fields.description.errors}
				/>
			</div>
			<StatusButton
				type="submit"
				size="lg"
				status={isPending ? 'pending' : (form.status ?? 'idle')}
				disabled={isPending}
				className="flex h-14 w-max items-center justify-center px-8 text-lg font-semibold"
			>
				<span>Submit and Continue</span>
			</StatusButton>
		</Form>
	)
}
