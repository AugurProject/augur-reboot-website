import { clsx } from "clsx";

interface PointerProps {
	animated?: "auto" | "always";
	direction?: "left" | "right" | "down";
	className?: string;
}

const Pointer: React.FC<PointerProps> = ({
	animated,
	direction = "right",
	className,
}) => (
	<span
		className={clsx(
			"pointer",
			`pointer-${direction}`,
			animated === "auto" && "pointer-animated",
			animated === "always" && "pointer-animate-always",
			className,
		)}
	></span>
);

export default Pointer;
