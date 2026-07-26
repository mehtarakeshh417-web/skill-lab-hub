import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton overflow-hidden rounded-xl bg-primary/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
