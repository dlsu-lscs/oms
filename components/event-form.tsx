"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, ControllerRenderProps, FieldValues, UseFormReturn, Control, SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Check, ChevronsUpDown, Clock, Loader2, X } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/event-form/button"
import { Input } from "@/components/event-form/input"
import { Textarea } from "@/components/event-form/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/event-form/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/event-form/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/event-form/popover"
import { Calendar } from "@/components/event-form/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/event-form/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/event-form/command"
import { Badge } from "@/components/event-form/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/components/event-form/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/event-form/tabs"

// Define the form schema with validation
const formSchema = z.object({
  arn: z.string().min(1, "ARN is required").max(20),
  name: z.string().min(1, "Event name is required").max(255),
  committee_id: z.string().min(1, "Committee is required").max(10),
  start_time: z.date({
    required_error: "Start time is required",
  }),
  end_time: z
    .date({
      required_error: "End time is required",
    })
    .refine((date) => date > new Date(), {
      message: "End time must be in the future",
    }),
  type: z.string().max(100).optional(),
  nature_id: z.coerce.number({
    required_error: "Nature is required",
  }),
  duration_id: z.coerce.number().optional(),
  brief_description: z.string().optional(),
  goals: z.string().optional(),
  objectives: z.string().optional(),
  strategies: z.string().optional(),
  measures: z.string().optional(),
  budget_allocation: z.coerce.number().default(0),
  venue: z.string().max(255).default("Online"),
  project_heads: z.array(z.number()).default([]),
}).refine((data) => data.end_time > data.start_time, {
  message: "End time must be after start time",
  path: ["end_time"],
})

type FormValues = z.infer<typeof formSchema>

// Mock data for dropdowns - replace with actual data from your database
const committees = [
  { id: "COM001", name: "Academic Committee" },
  { id: "COM002", name: "Social Committee" },
  { id: "COM003", name: "Sports Committee" },
]

const natures = [
  { id: 1, name: "Academic" },
  { id: 2, name: "Social" },
  { id: 3, name: "Sports" },
]

const durations = [
  { id: 1, name: "Half Day" },
  { id: 2, name: "Full Day" },
  { id: 3, name: "Multiple Days" },
]

const staff = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Alex Johnson" },
  { id: 4, name: "Sarah Williams" },
  { id: 5, name: "Michael Brown" },
  { id: 6, name: "Emily Davis" },
  { id: 7, name: "Robert Wilson" },
  { id: 8, name: "Jennifer Taylor" },
]

// Replace the calendar-based date picker with a simpler version
const DateTimePicker = ({ value, onChange, label }: { value: Date | undefined; onChange: (date: Date) => void; label: string }) => {
  const [date, setDate] = useState(value ? format(value, "yyyy-MM-dd") : "")
  const [time, setTime] = useState(value ? format(value, "HH:mm") : "00:00")

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDate(newDate)
    if (newDate && time) {
      const [hours, minutes] = time.split(":")
      const dateTime = new Date(newDate)
      dateTime.setHours(parseInt(hours, 10))
      dateTime.setMinutes(parseInt(minutes, 10))
      onChange(dateTime)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    if (date && newTime) {
      const [hours, minutes] = newTime.split(":")
      const dateTime = new Date(date)
      dateTime.setHours(parseInt(hours, 10))
      dateTime.setMinutes(parseInt(minutes, 10))
      onChange(dateTime)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="h-8 text-sm"
        />
        <Input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}

export function EventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openProjectHeads, setOpenProjectHeads] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      arn: "",
      name: "",
      committee_id: "",
      type: "",
      brief_description: "",
      goals: "",
      objectives: "",
      strategies: "",
      measures: "",
      budget_allocation: 0,
      venue: "Online",
      project_heads: [],
    },
  })

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)
    try {
      // Call the server action to create the event
      form.reset()
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "There was an error creating your event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to toggle a project head selection
  const toggleProjectHead = (id: number, currentValue: number[]) => {
    return currentValue.includes(id) ? currentValue.filter((headId) => headId !== id) : [...currentValue, id]
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Info Section - ARN, Event Name, Committee in one row */}
            <div className="grid grid-cols-12 gap-3">
              {/* ARN - smaller */}
              <FormField
                control={form.control}
                name="arn"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-sm">ARN</FormLabel>
                    <FormControl>
                      <Input className="text-sm h-8 text-xs" placeholder="ARN-001" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Event Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-7">
                    <FormLabel className="text-sm">Event Name</FormLabel>
                    <FormControl>
                      <Input className="text-sm h-8" placeholder="Enter event name" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Committee */}
              <FormField
                control={form.control}
                name="committee_id"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel className="text-sm">Committee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-sm h-8">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {committees.map((committee) => (
                          <SelectItem key={committee.id} value={committee.id} className="text-sm">
                            {committee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Time and Duration Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Start Time - Improved UI */}
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Start Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="Start Time"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* End Time - Improved UI */}
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">End Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="End Time"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Duration</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm h-8">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration.id} value={duration.id.toString()} className="text-sm">
                            {duration.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Event Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Event Type</FormLabel>
                    <FormControl>
                      <Input className="text-sm h-8" placeholder="Workshop, Seminar" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Nature */}
              <FormField
                control={form.control}
                name="nature_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nature</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm h-8">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {natures.map((nature) => (
                          <SelectItem key={nature.id} value={nature.id.toString()} className="text-sm">
                            {nature.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Venue */}
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Venue</FormLabel>
                    <FormControl>
                      <Input className="text-sm h-8" placeholder="Online, Room 101" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Project Heads and Budget Allocation in the same row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Project Heads - Multi-select with search */}
              <FormField
                control={form.control}
                name="project_heads"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel className="text-sm">Project Heads</FormLabel>
                    <Popover open={openProjectHeads} onOpenChange={setOpenProjectHeads}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openProjectHeads}
                            className={cn(
                              "w-full justify-between text-sm h-8 min-h-[32px]",
                              !field.value.length && "text-muted-foreground",
                            )}
                            onClick={() => setOpenProjectHeads(true)}
                          >
                            {field.value.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden">
                                {field.value.length <= 2
                                  ? field.value.map((id) => {
                                      const person = staff.find((s) => s.id === id)
                                      return person ? (
                                        <Badge
                                          variant="secondary"
                                          key={id}
                                          className="text-xs py-0 px-1"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            field.onChange(field.value.filter((i) => i !== id))
                                          }}
                                        >
                                          {person.name}
                                          <X className="ml-1 h-3 w-3" />
                                        </Badge>
                                      ) : null
                                    })
                                  : `${field.value.length} people selected`}
                              </div>
                            ) : (
                              "Select project heads"
                            )}
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search staff..."
                            className="text-sm h-8"
                            value={searchValue}
                            onValueChange={setSearchValue}
                          />
                          <CommandList>
                            <CommandEmpty>No staff found.</CommandEmpty>
                            <CommandGroup>
                              {staff
                                .filter((person) => person.name.toLowerCase().includes(searchValue.toLowerCase()))
                                .map((person) => (
                                  <CommandItem
                                    key={person.id}
                                    value={person.name}
                                    onSelect={() => {
                                      field.onChange(toggleProjectHead(person.id, field.value))
                                      setSearchValue("")
                                    }}
                                    className="text-sm"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-3 w-3",
                                        field.value.includes(person.id) ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    {person.name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Budget Allocation */}
              <FormField
                control={form.control}
                name="budget_allocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Budget</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="text-sm h-8"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Brief Description and Goals in the same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Brief Description */}
              <FormField
                control={form.control}
                name="brief_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Brief Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a brief description of the event"
                        className="min-h-[60px] text-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Goals */}
              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What are the goals of this event?"
                        className="min-h-[60px] text-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Objectives, Strategies, Measures in the same row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Objectives */}
              <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Objectives</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What are the specific objectives?"
                        className="min-h-[60px] text-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Strategies */}
              <FormField
                control={form.control}
                name="strategies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Strategies</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What strategies will be used?"
                        className="min-h-[60px] text-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Measures */}
              <FormField
                control={form.control}
                name="measures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Measures</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="How will success be measured?"
                        className="min-h-[60px] text-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} size="sm">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
