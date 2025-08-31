import { Image, OpenImgContextProvider } from 'openimg/react'
import {
	data,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from 'react-router'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { type Route } from './+types/root.ts'
import appleTouchIconAssetUrl from './assets/favicons/apple-touch-icon.png'
import faviconAssetUrl from './assets/favicons/favicon.svg'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { useToast } from './components/toaster.tsx'
import { Badge } from './components/ui/badge.tsx'
import { Button } from './components/ui/button.tsx'
import { href as iconsHref } from './components/ui/icon.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import { UserDropdown } from './components/user-dropdown.tsx'
import {
	ThemeSwitch,
	useOptionalTheme,
	useTheme,
} from './routes/resources+/theme-switch.tsx'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { getUserId, logout } from './utils/auth.server.ts'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { pipeHeaders } from './utils/headers.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl, getImgSrc } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { type Theme, getTheme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'
import { useOptionalUser } from './utils/user.ts'

export const links: Route.LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		{
			rel: 'icon',
			href: '/favicon.ico',
			sizes: '48x48',
		},
		{ rel: 'icon', type: 'image/svg+xml', href: faviconAssetUrl },
		{ rel: 'apple-touch-icon', href: appleTouchIconAssetUrl },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
	].filter(Boolean)
}

export const meta: Route.MetaFunction = ({ data }) => {
	return [
		{ title: data ? 'ShuvoDin' : 'Error | ShuvoDin' },
		{
			name: 'description',
			content:
				"Bangladesh's premier wedding marketplace connecting couples with verified vendors for their perfect wedding day.",
		},
	]
}

export async function loader({ request }: Route.LoaderArgs) {
	const timings = makeTimings('root loader')
	const userId = await time(() => getUserId(request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	const user = userId
		? await time(
				() =>
					prisma.user.findUnique({
						select: {
							id: true,
							name: true,
							username: true,
							image: { select: { objectKey: true } },
							vendor: {
								select: { id: true, businessName: true, slug: true },
							},
							roles: {
								select: {
									name: true,
									permissions: {
										select: { entity: true, action: true, access: true },
									},
								},
							},
						},
						where: { id: userId },
					}),
				{ timings, type: 'find user', desc: 'find user in root' },
			)
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await logout({ request, redirectTo: '/' })
	}
	const { toast, headers: toastHeaders } = await getToast(request)
	const honeyProps = await honeypot.getInputProps()

	return data(
		{
			user,
			isVendor: Boolean(user?.vendor),
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			toast,
			honeyProps,
		},
		{
			headers: combineHeaders(
				{ 'Server-Timing': timings.toString() },
				toastHeaders,
			),
		},
	)
}

export const headers: Route.HeadersFunction = pipeHeaders

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string | undefined>
}) {
	const allowIndexing = ENV.ALLOW_INDEXING !== 'false'
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{allowIndexing ? null : (
					<meta name="robots" content="noindex, nofollow" />
				)}
				<Links />
			</head>
			<body className="bg-background text-foreground min-h-screen antialiased">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	// if there was an error running the loader, data could be missing
	const data = useLoaderData<typeof loader | null>()
	const nonce = useNonce()
	const theme = useOptionalTheme()
	return (
		<Document nonce={nonce} theme={theme} env={data?.ENV}>
			{children}
		</Document>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	const theme = useTheme()
	useToast(data.toast)

	return (
		<OpenImgContextProvider
			optimizerEndpoint="/resources/images"
			getSrc={getImgSrc}
		>
			<header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full backdrop-blur">
				<div className="container flex h-20 items-center justify-between">
					<Link to="/" className="flex items-center space-x-2">
						<Image
							src="/img/logo.png"
							alt="ShuvoDin"
							width={128}
							height="auto"
							className="w-24 object-contain"
						/>
					</Link>

					<nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
						<Link to="/" className="hover:text-primary transition-colors">
							Home
						</Link>
						<Link
							to="/services"
							className="hover:text-primary transition-colors"
						>
							Services
						</Link>
						<Link
							to="/vendors"
							className="hover:text-primary transition-colors"
						>
							Vendors
						</Link>
						<Link to="/about" className="hover:text-primary transition-colors">
							About
						</Link>
					</nav>

					<div className="flex items-center space-x-4">
						<ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
						{user ? (
							<UserDropdown />
						) : (
							<Button variant="ghost" size="sm">
								Sign In
							</Button>
						)}
						<Button size="sm" asChild>
							<Link to="/vendors/onboarding/hint" prefetch="intent">
								Join as Vendor
							</Link>
						</Button>
					</div>
				</div>
			</header>

			<main className="bg-background flex flex-1 flex-col">
				<Outlet />
			</main>

			{/* Footer */}
			<footer className="bg-muted/30 container border-t py-16">
				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
					<div className="space-y-6 lg:col-span-2">
						<Image
							src="/logo.png"
							alt="ShuvoDin"
							width={150}
							height={50}
							className="h-12 w-auto"
						/>
						<p className="text-muted-foreground max-w-md">
							Bangladesh's premier wedding marketplace connecting couples with
							verified vendors for their perfect wedding day. Trusted by
							thousands across the country.
						</p>
						<div className="flex items-center gap-4">
							<Badge variant="secondary">🏆 #1 Wedding Platform</Badge>
							<Badge variant="secondary">⭐ 4.8/5 Rating</Badge>
						</div>
					</div>

					<div className="space-y-4">
						<h4 className="text-lg font-semibold">Services</h4>
						<div className="text-muted-foreground space-y-3 text-sm">
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Photographer
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Venues
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Catering
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Decoration
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Event Planning
							</Link>
						</div>
					</div>

					<div className="space-y-4">
						<h4 className="text-lg font-semibold">Locations</h4>
						<div className="text-muted-foreground space-y-3 text-sm">
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Dhaka
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Chittagong
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Sylhet
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Rajshahi
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								All Cities
							</Link>
						</div>
					</div>

					<div className="space-y-4">
						<h4 className="text-lg font-semibold">Support</h4>
						<div className="text-muted-foreground space-y-3 text-sm">
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Help Center
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Contact Us
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Vendor Support
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Terms & Conditions
							</Link>
							<Link
								to="#"
								className="hover:text-primary block transition-colors"
							>
								Privacy Policy
							</Link>
						</div>
					</div>
				</div>

				<p className="text-muted-foreground mt-12 border-t pt-8 text-sm">
					&copy; 2024 ShuvoDin. All rights reserved. <br /> Made with ❤️ for
					Bangladesh
				</p>
			</footer>
			<EpicToaster closeButton position="top-center" theme={theme} />
			<EpicProgress />
		</OpenImgContextProvider>
	)
}

function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<App />
		</HoneypotProvider>
	)
}

export default AppWithProviders

// this is a last resort error boundary. There's not much useful information we
// can offer at this level.
export const ErrorBoundary = GeneralErrorBoundary
