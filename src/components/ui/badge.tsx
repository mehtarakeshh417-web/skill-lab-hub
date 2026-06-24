import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40",
        secondary:
          "border-border/60 bg-secondary/70 backdrop-blur-md text-secondary-foreground hover:bg-secondary",
        destructive:
          "border-transparent bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-md shadow-destructive/30",
        outline: "border-border/70 text-foreground bg-background/40 backdrop-blur-md",
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
