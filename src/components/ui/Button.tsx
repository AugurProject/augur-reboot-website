import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  as?: 'button' | 'a';
  href?: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  as: 'a';
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

type Props = ButtonProps | AnchorProps;

// buttonVariants function (mimics shadcn's CVA approach)
function buttonVariants({ variant, size }: { variant: string; size: string }) {
  const base = "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50 hover:cursor-pointer";

  const variants = {
    default: "bg-primary text-background hover:bg-primary/90",
    destructive: "bg-red-600 text-white hover:bg-red-600/90",
    outline: "border border-primary bg-transparent text-primary hover:bg-primary hover:text-background",
    secondary: "bg-muted text-muted-foreground hover:bg-muted/80",
    ghost: "text-foreground hover:bg-foreground/10",
    link: "text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow"
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-xs",
    lg: "h-11 px-8 text-base",
    xl: "h-14 px-8 text-xl",
    icon: "h-10 w-10"
  };

  // Link variant doesn't use size classes
  const sizeClass = variant === 'link' ? '' : sizes[size as keyof typeof sizes];

  return cn(base, variants[variant as keyof typeof variants], sizeClass);
}

const Button: React.FC<Props> = ({
  variant = 'default',
  size = 'default',
  as,
  href,
  external,
  className,
  children,
  ...rest
}) => {
  // Auto-detect element type (mimics shadcn's asChild behavior)
  const element = href ? 'a' : (as || 'button');

  // Auto-detect external links
  const isExternal = external ?? (href?.startsWith('http') || href?.startsWith('//'));

  const buttonClasses = buttonVariants({ variant, size });
  const allClasses = cn(buttonClasses, className);

  if (element === 'a' && href) {
    const externalProps = isExternal ? {
      target: "_blank",
      rel: "noopener noreferrer"
    } : {};

    return (
      <a
        href={href}
        className={allClasses}
        {...externalProps}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={allClasses}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
};

export default Button;
