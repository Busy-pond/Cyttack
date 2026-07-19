import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        critical: "border-transparent bg-critical/20 text-critical border-critical/30",
        high: "border-transparent bg-high/20 text-high border-high/30",
        medium: "border-transparent bg-medium/20 text-medium border-medium/30",
        low: "border-transparent bg-low/20 text-low border-low/30",
        contained: "border-transparent bg-contained/20 text-contained border-contained/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
