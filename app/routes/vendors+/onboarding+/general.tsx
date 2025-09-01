import {
	getFormProps,
	getInputProps,
	getSelectProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { data, Form, redirect } from 'react-router'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { generateSlug } from '#app/utils/slug.server.tsx'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { Field, SelectField, TextareaField } from '#app/components/forms.tsx'
import {
	districtsByDivision,
	divisions,
	thanaByDistrict,
} from '#app/utils/locations.ts'
import { Route } from './+types/general'
import React from 'react'

export const GeneralInfoSchema = z
	.object({
		businessName: z.string().min(3, 'Business name is required'),
		vendorTypeId: z.string().min(1, 'Vendor type is required'),
		division: z.string().min(2, 'Division is required'),
		district: z.string().min(2, 'District is required'),
		thana: z.string().min(2, 'Thana is required'),
		address: z.string().optional(),
		description: z.string().min(10).max(500),
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

	await prisma.vendor.create({
		data: {
			businessName,
			slug,
			vendorTypeId,
			division,
			district,
			thana,
			address,
			description,
			ownerId: userId,
		},
	})

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

	const districts = selectedDivision
		? districtsByDivision[
				selectedDivision as keyof typeof districtsByDivision
			] || []
		: []

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

	return (
		<Form
			method="post"
			{...getFormProps(form)}
			className="grid grid-cols-1 gap-6 md:grid-cols-2"
		>
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
					...getSelectProps(fields.division),
				}}
				options={divisions.map((div) => ({
					value: div,
					label: div,
				}))}
				errors={fields.division.errors}
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

			<TextareaField
				labelProps={{ children: 'Description' }}
				textareaProps={{
					...getTextareaProps(fields.description),
				}}
				errors={fields.description.errors}
			/>
		</Form>
	)
}
