interface MigrationCtaProps {
	href?: string
	eyebrow: string
	title: string
	description: string
	className?: string
}

export default function MigrationCta({
	href = '/learn/fork/migration/',
	eyebrow,
	title,
	description,
	className = '',
}: MigrationCtaProps) {
	return (
		<a
			href={href}
			className={`block border border-red-500/60 bg-red-500/[0.04] hover:bg-red-500/[0.08] transition-colors px-6 py-5 no-underline ${className}`}
		>
			<div className="font-display uppercase tracking-wider text-[0.7rem] text-red-500 mb-2 flex items-center gap-2">
				<span className="inline-block w-2 h-2 bg-red-500" aria-hidden="true" />
				<span>{eyebrow}</span>
			</div>
			<div className="text-loud-foreground font-display uppercase text-xl sm:text-2xl leading-tight">
				{title} <span className="text-foreground">→</span>
			</div>
			<div className="text-muted-foreground text-sm mt-1">{description}</div>
		</a>
	)
}
