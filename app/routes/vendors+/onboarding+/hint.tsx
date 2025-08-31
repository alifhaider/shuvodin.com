import { Link } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import { Card, CardContent } from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export default function VendorOnboardingHint() {
	return (
		<>
			{/* Hero Section */}
			<div className="space-y-4 text-center">
				<p className="text-muted-foreground mx-auto max-w-2xl text-lg text-balance">
					Set up your vendor profile in just a few simple steps. Create a
					compelling presence that attracts customers and grows your business.
				</p>
			</div>

			{/* Process Steps */}
			<div className="grid gap-6 md:grid-cols-3">
				<Card className="border-accent/50 hover:border-accent border-2 bg-gray-50 transition-colors dark:bg-gray-800">
					<CardContent className="space-y-4 p-6 text-center">
						<div className="bg-primary/10 inline-flex h-12 w-12 items-center justify-center rounded-full">
							<Icon name="pencil-2" className="text-primary h-6 w-6" />
						</div>
						<h3 className="text-foreground font-semibold">
							Complete Your Profile
						</h3>
						<p className="text-muted-foreground text-sm">
							Add your business details, contact information, and service
							descriptions to create a comprehensive profile.
						</p>
					</CardContent>
				</Card>

				<Card className="border-accent/50 hover:border-accent border-2 bg-gray-50 transition-colors dark:bg-gray-800">
					<CardContent className="space-y-4 p-6 text-center">
						<div className="bg-primary/10 inline-flex h-12 w-12 items-center justify-center rounded-full">
							<Icon name="upload" className="text-primary h-6 w-6" />
						</div>
						<h3 className="text-foreground font-semibold">
							Upload Quality Images
						</h3>
						<p className="text-muted-foreground text-sm">
							Showcase your work with high-resolution photos that highlight your
							products or services.
						</p>
					</CardContent>
				</Card>

				<Card className="border-accent/50 hover:border-accent border-2 bg-gray-50 transition-colors dark:bg-gray-800">
					<CardContent className="space-y-4 p-6 text-center">
						<div className="bg-primary/10 inline-flex h-12 w-12 items-center justify-center rounded-full">
							<Icon name="circle-check" className="text-primary h-6 w-6" />
						</div>
						<h3 className="text-foreground font-semibold">Review & Launch</h3>
						<p className="text-muted-foreground text-sm">
							Double-check your information and go live to start connecting with
							potential customers.
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Key Benefits */}

			{/* CTA Section */}
			<div className="space-y-4 text-center">
				<p className="text-muted-foreground">
					Ready to get started? The process takes just a few minutes.
				</p>
				<Button size="lg" className="px-8" asChild>
					<Link to="/vendors/onboarding/general">Start Onboarding Process</Link>
				</Button>
				<p className="text-muted-foreground text-xs">
					Need help?{' '}
					<Link to="/help" className="text-primary hover:underline">
						Contact our support team{' '}
					</Link>{' '}
					anytime
				</p>
			</div>
		</>
	)
}
