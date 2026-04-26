import * as React from "react";
import { cn } from "./utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  destructive: "bg-destructive text-white border-transparent",
  outline: "text-foreground",
};

export function badgeVariants({
  variant = "default",
  className,
}: { variant?: BadgeVariant; className?: string } = {}) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
    variantClasses[variant],
    className,
  );
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return <span className={badgeVariants({ variant, className })} {...props} />;
}
