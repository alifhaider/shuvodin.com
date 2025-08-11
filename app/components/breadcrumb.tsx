import { Link } from 'react-router'

export default function Breadcrumb({
	items,
}: {
	items: { to: string; label: string | undefined; isCurrent?: boolean }[]
}) {
	return (
		<ul className="flex items-center gap-2 text-sm capitalize">
			{items.map((item, index) => (
				<li
					key={index}
					className={item.isCurrent ? 'text-primary' : 'text-muted-foreground'}
				>
					<Link to={item.to} className="hover:text-primary">
						{item.label}
					</Link>
					{index < items.length - 1 && items[index + 1]?.label && (
						<span className="ml-2">/</span>
					)}
				</li>
			))}
		</ul>
	)
}
