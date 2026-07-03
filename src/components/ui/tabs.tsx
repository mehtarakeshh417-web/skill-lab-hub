import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-muted/70 backdrop-blur-xl p-1.5 text-muted-foreground shadow-[inset_0_2px_4px_0_oklch(0_0_0_/_0.25),inset_0_-1px_0_0_oklch(1_0_0_/_0.05)]",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2 text-sm font-semibold ring-offset-background cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-gradient-to-br data-[state=active]:from-card data-[state=active]:via-card data-[state=active]:to-card/70 data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.15),0_2px_0_0_oklch(0_0_0_/_0.35),0_10px_24px_-6px_oklch(0.62_0.205_274_/_0.35)] data-[state=active]:ring-1 data-[state=active]:ring-primary/25 data-[state=active]:-translate-y-px hover:text-foreground",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
