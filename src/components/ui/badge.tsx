import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "chip-3d border-transparent bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground",
        secondary:
          "chip-3d border-border/60 bg-gradient-to-br from-secondary to-secondary/70 backdrop-blur-md text-secondary-foreground",
        destructive:
          "chip-3d border-transparent bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground",
        outline: "border-border/70 bg-background/40 text-foreground shadow-inner backdrop-blur-md",
        accent:
          "chip-3d border-transparent bg-gradient-gold text-accent-foreground",
        success:
          "border-transparent bg-success/15 text-success ring-1 ring-inset ring-success/30",
        warning:
          "border-transparent bg-warning/15 text-warning ring-1 ring-inset ring-warning/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
