import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          {
            "border-transparent bg-primary text-primary-foreground":
              variant === "default",
            "border-transparent bg-secondary text-secondary-foreground":
              variant === "secondary",
            "border-transparent bg-destructive text-destructive-foreground":
              variant === "destructive",
            "text-foreground": variant === "outline",
            "border-transparent bg-emerald-950 text-emerald-100":
              variant === "success",
            "border-transparent bg-yellow-950 text-yellow-100":
              variant === "warning",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
