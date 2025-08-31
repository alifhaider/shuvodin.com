import { getInputProps, getSelectProps } from '@conform-to/react'
import { vendorTypes } from '#app/utils/constants.ts'

export function GeneralStep({ fields }: { fields: any }) {
	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">General Information</h2>

			<div>
				<label>Business Name</label>
				<input
					{...getInputProps(fields.businessName, { type: 'text' })}
					className="w-full border p-2"
				/>
				<div className="text-red-500">{fields.businessName.errors}</div>
			</div>

			<div>
				<label>Vendor Slug</label>
				<input
					{...getInputProps(fields.slug, { type: 'text' })}
					className="w-full border p-2"
				/>
				<div className="text-red-500">{fields.slug.errors}</div>
			</div>

			<div>
				<label>Vendor Type</label>
				<select
					{...getSelectProps(fields.vendorType)}
					className="w-full border p-2"
				>
					<option value="">Select vendor type</option>
					{Object.values(vendorTypes).map((type) => (
						<option key={type.slug} value={type.slug}>
							{type.title}
						</option>
					))}
				</select>
				<div className="text-red-500">{fields.vendorType.errors}</div>
			</div>

			{/* Add other general fields */}
		</div>
	)
}
