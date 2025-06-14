import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Step {
  title: string
  description?: string
  subtext?: string
  date?: string
  icon?: React.ReactNode
  circleClassName?: string
  circleStyle?: React.CSSProperties
  actionButton?: {
    label: string
    onClick: () => void
  }
  className?: string
}

interface StepperProps {
  steps: Step[]
}

export function Stepper({ steps }: StepperProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2",
                step.circleClassName
              )}
              style={step.circleStyle}
            >
              <div className="h-5 w-5 flex items-center justify-center">
              {step.icon || (
                <span className="text-sm font-medium text-muted-foreground/25">{index + 1}</span>
              )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn("w-0.5 h-full my-2 bg-muted-foreground/25")} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className={cn("text-sm font-medium", step.className || "text-foreground")}>{step.title}</h3>
                {step.description && (
                  <div className="space-y-1">
                    <p className={cn("text-sm", step.className || "text-muted-foreground")}>{step.description}</p>
                    {step.subtext && (
                      <p className={cn("text-xs", step.className || "text-muted-foreground")}>{step.subtext}</p>
                    )}
                    {step.actionButton && (
                      <Button
                        onClick={step.actionButton.onClick}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "mt-2",
                          step.className ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {step.actionButton.label}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {step.date && (
                <span className="text-sm text-muted-foreground">{step.date}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 