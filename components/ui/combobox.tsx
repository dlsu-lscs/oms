"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { label: string; value: string }[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  emptyText = "No items found.",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    if (value.includes(currentValue)) {
      onChange(value.filter((v) => v !== currentValue))
    } else {
      onChange([...value, currentValue])
    }
  }

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter((item) => item !== itemToRemove))
  }

  // Filter out selected items from the dropdown options
  const availableOptions = options.filter(
    (option) => !value.includes(option.label)
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <div
            key={item}
            className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
          >
            <span>{item}</span>
            <button
              onClick={() => handleRemove(item)}
              className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length === 0 ? placeholder : `${value.length} items selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {availableOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    handleSelect(option.label)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
} 