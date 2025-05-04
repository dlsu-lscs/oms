import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: {
    title: string
    description?: string
    status: "complete" | "current" | "upcoming"
    date?: string
    actionButton?: {
      label: string
      onClick: () => void
    }
  }[]
}

export function Stepper({ steps, className, ...props }: StepperProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {steps.map((step, index) => (
        <div key={step.title} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2",
                step.status === "complete" && "border-primary bg-primary text-primary-foreground",
                step.status === "current" && "border-primary",
                step.status === "upcoming" && "border-muted-foreground/25"
              )}
            >
              {step.status === "complete" ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className={cn(
                  "text-sm font-medium",
                  step.status === "current" ? "text-primary" : "text-muted-foreground/25"
                )}>
                  {index + 1}
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-0.5 h-full my-2",
                  step.status === "complete" ? "bg-primary" : "bg-muted-foreground/25"
                )}
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className={cn(
                "text-sm font-medium",
                step.status === "current" ? "text-primary" : "text-foreground"
              )}>
                {step.title}
              </h3>
              {step.date && (
                <span className="text-sm text-muted-foreground">
                  {step.date}
                </span>
              )}
            </div>
            {step.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {step.description}
              </p>
            )}
            {step.actionButton && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={step.actionButton.onClick}
              >
                {step.actionButton.label}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 