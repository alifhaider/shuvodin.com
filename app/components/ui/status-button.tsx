import { useSpinDelay } from 'spin-delay'
import { cn } from '#app/utils/misc.tsx'
import { Button, type ButtonVariant } from './button.tsx'
import { Icon } from './icon.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip.tsx'

export const StatusButton = ({
	message,
	status,
	className,
	children,
	spinDelay,
	...props
}: React.ComponentProps<'button'> &
	ButtonVariant & {
		status: 'pending' | 'success' | 'error' | 'idle'
		message?: string | null
		spinDelay?: Parameters<typeof useSpinDelay>[1]
	}) => {
	const delayedPending = useSpinDelay(status === 'pending', {
		delay: 400,
		minDuration: 300,
		...spinDelay,
	})
	const companion = {
		pending: delayedPending ? (
			<div
				role="status"
				className="inline-flex size-6 items-center justify-center"
			>
				<Icon name="update" className="animate-spin" title="loading" />
			</div>
		) : null,
		success: (
			<div
				role="status"
				className="inline-flex size-6 items-center justify-center"
			>
				<Icon name="check" title="success" />
			</div>
		),

		error: <></>,
		idle: null,
	}[status]

	return (
		<Button
			className={cn(
				'flex justify-center gap-4',
				className,
				status === 'error' ? 'bg-destructive hover:bg-destructive/70' : '',
			)}
			{...props}
		>
			<div>{children}</div>
			{message ? (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>{companion}</TooltipTrigger>
						<TooltipContent>{message}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : (
				companion
			)}
		</Button>
	)
}
StatusButton.displayName = 'Button'
