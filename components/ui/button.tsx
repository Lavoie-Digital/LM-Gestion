import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "dark" | "light" | "outline" | "outline-light" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-medium tracking-tight cursor-pointer transition-[background-color,color,border-color,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-50";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[15px]",
};

const variants: Record<Variant, string> = {
  dark: "bg-ink text-paper hover:bg-noir",
  light: "bg-paper text-ink hover:bg-white",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "outline-light":
    "border border-paper/30 text-paper hover:border-paper hover:bg-paper hover:text-ink",
  ghost: "text-ink hover:opacity-60",
};

export function buttonClasses(variant: Variant = "dark", size: Size = "md", className?: string) {
  return cn(base, sizes[size], variants[variant], className);
}

function Arrow() {
  return (
    <ArrowRight className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
  );
}

export function ButtonLink({
  children,
  href,
  variant = "dark",
  size = "md",
  className,
  arrow = false,
  ...rest
}: {
  children: ReactNode;
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  arrow?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function Button({
  children,
  variant = "dark",
  size = "md",
  className,
  arrow = false,
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
} & ComponentProps<"button">) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}
