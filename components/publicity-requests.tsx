"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X, ChevronsUpDown, Search, Plus, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { PublicityRequest } from "@/app/api/publicity-requests/route"
import { MultiselectDropdown } from "@/components/ui/MultiselectDropdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ExternalLink } from "lucide-react"

// Define valid publicity types
const PUB_TYPES: { label: string; value: string; level: number }[] = [
  { label: "Facebook Post", value: "Facebook Post", level: 0 },
  { label: "Instagram Post", value: "Instagram Post", level: 0 },
  { label: "Instagram Story", value: "Instagram Story", level: 0 },
  { label: "Youtube Video", value: "Youtube Video", level: 0 },
  { label: "Spotify Podcast", value: "Spotify Podcast", level: 0 },
  { label: "Google Drive Document", value: "Google Drive Document", level: 0 },
]

// Define publicity dimensions
const PUB_DIMENSIONS: { label: string; value: string; level: number }[] = [
  { label: "1080x1080 (Instagram Post)", value: "1080x1080", level: 0 },
  { label: "1080x1920 (Instagram Story)", value: "1080x1920", level: 0 },
  { label: "1200x630 (Facebook Post)", value: "1200x630", level: 0 },
  { label: "1920x1080 (Youtube Video)", value: "1920x1080", level: 0 },
  { label: "1400x1400 (Spotify Podcast)", value: "1400x1400", level: 0 },
  { label: "Letter (Google Drive Document)", value: "Letter", level: 0 },
]

// Define the form schema
const formSchema = z.object({
  event_id: z.number().optional(),
  pub_type: z.string().optional(),
  pub_details: z.string().min(1, "Details are required"),
  pub_content: z.string().min(1, "Content is required"),
  caption: z.string().min(1, "Caption is required"),
  posting_date: z.date(),
  dimensions: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

// Add status color map and labels
const statusColorMap = {
  // Green statuses
  DONE: 'bg-green-500 text-white',
  SCHEDULED: 'bg-green-500 text-white',
  
  // Orange statuses
  DRAFTING: 'bg-orange-500 text-white',
  WAITING: 'bg-orange-500 text-white',
  
  // Yellow statuses
  FORSCHED: 'bg-yellow-500 text-white',
  SUBMITTED: 'bg-yellow-500 text-white',
  
  // Red statuses
  CANCELLED: 'bg-red-500 text-white',
  HOLD: 'bg-red-500 text-white',
  
  // Grey statuses (default)
  INIT: 'bg-gray-500 text-white',
  DRAFTED: 'bg-gray-500 text-white',
};

const statusLabels = {
  INIT: 'Not Started',
  DRAFTED: 'Sent Draft',
  DRAFTING: 'In Progress',
  FORSCHED: 'For Scheduling',
  HOLD: 'On Hold',
  SCHEDULED: 'Scheduled',
  SUBMITTED: 'Submitted to CSO',
  WAITING: 'Waiting for Pre-acts',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

interface Member {
  id: number;
  full_name: string;
  email: string;
}

export function PublicityRequests() {
  const { data: session } = useSession()
  const [requests, setRequests] = React.useState<PublicityRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [events, setEvents] = React.useState<Array<{ id: number; name: string }>>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [members, setMembers] = React.useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = React.useState<Member[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [assigningHead, setAssigningHead] = React.useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = React.useState<string | null>(null)

  // Create a stable initial date
  const initialDate = React.useMemo(() => new Date(), [])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pub_type: undefined,
      pub_details: "",
      pub_content: "",
      caption: "",
      posting_date: undefined,
      dimensions: undefined,
    },
  })

  // Fetch events for search
  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events/search?q=" + encodeURIComponent(searchQuery))
        if (!response.ok) throw new Error("Failed to fetch events")
        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }

    if (searchQuery.length >= 3) {
      fetchEvents()
    } else {
      setEvents([])
    }
  }, [searchQuery])

  // Fetch publicity requests
  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch("/api/publicity-requests")
        if (!response.ok) throw new Error("Failed to fetch requests")
        const data = await response.json()
        setRequests(data)
      } catch (error) {
        console.error("Error fetching requests:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequests()
  }, [])

  // Fetch members
  React.useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members')
        if (!response.ok) throw new Error('Failed to fetch members')
        const data = await response.json()
        setMembers(data)
      } catch (error) {
        console.error('Error fetching members:', error)
      }
    }

    fetchMembers()
  }, [])

  // Filter members based on search query
  React.useEffect(() => {
    if (searchQuery.length >= 3) {
      const filtered = members
        .filter(member => 
          member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10)
      setFilteredMembers(filtered)
    } else {
      setFilteredMembers([])
    }
  }, [searchQuery, members])

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/publicity-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create request")

      // Refresh the list
      const updatedResponse = await fetch("/api/publicity-requests")
      const updatedData = await updatedResponse.json()
      setRequests(updatedData)

      // Close dialog and reset form
      setIsDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error creating request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProjectHeadAssign = async (requestId: string, memberId: number) => {
    try {
      setAssigningHead(requestId)
      const response = await fetch('/api/publicity-requests/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, memberId }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign publicity head')
      }

      // Update the local state
      setRequests(prevRequests => 
        prevRequests.map(request => {
          if (request.id === requestId) {
            const member = members.find(m => m.id === memberId)
            return {
              ...request,
              pub_head: memberId,
              pub_head_name: member?.full_name || '',
            }
          }
          return request
        })
      )
      setSearchQuery('')
    } catch (error) {
      console.error('Error assigning publicity head:', error)
    } finally {
      setAssigningHead(null)
    }
  }

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      setUpdatingStatus(requestId)
      const response = await fetch('/api/publicity-requests/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Update the local state
      setRequests(prevRequests =>
        prevRequests.map(request => {
          if (request.id === requestId) {
            return {
              ...request,
              pub_status: newStatus,
            }
          }
          return request
        })
      )
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Publicity Requests</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Publicity Request</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new publicity request.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="posting_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Posting Date</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            {field.value ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(field.value, "yyyy-MM-dd")}
                                </span>
                                <button
                                  onClick={() => field.onChange(null)}
                                  className="p-1 hover:bg-destructive/10 rounded-sm"
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            ) : (
                              <Calendar
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pub_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publicity Type</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            {field.value ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md">
                                <span className="text-sm">{field.value}</span>
                                <button
                                  onClick={() => field.onChange(null)}
                                  className="p-1 hover:bg-destructive/10 rounded-sm"
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            ) : (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {PUB_TYPES.map((type) => (
                                      <button
                                        key={type.value}
                                        onClick={() => {
                                          field.onChange(type.value);
                                        }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                                      >
                                        <div className="flex flex-col flex-1 min-w-0 text-left">
                                          <span className="truncate">{type.label}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            {field.value ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md">
                                <span className="text-sm">{field.value}</span>
                                <button
                                  onClick={() => field.onChange(null)}
                                  className="p-1 hover:bg-destructive/10 rounded-sm"
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            ) : (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {PUB_DIMENSIONS.map((dim) => (
                                      <button
                                        key={dim.value}
                                        onClick={() => {
                                          field.onChange(dim.value);
                                        }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                                      >
                                        <div className="flex flex-col flex-1 min-w-0 text-left">
                                          <span className="truncate">{dim.label}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="event_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event (Optional)</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {field.value ? (
                                <div className="flex items-center gap-2">
                                  <span className="truncate">
                                    {events.find(e => e.id === field.value)?.name || "Select event..."}
                                  </span>
                                </div>
                              ) : (
                                "Select event..."
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <div className="flex items-center border-b px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <input
                                className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                              {searchQuery && (
                                <button
                                  onClick={() => setSearchQuery("")}
                                  className="ml-2 p-1 hover:bg-accent rounded-sm"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                              {searchQuery.length < 3 ? (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                  Type at least 3 characters to search
                                </div>
                              ) : events.length > 0 ? (
                                <div className="p-1">
                                  {events.map((event) => (
                                    <button
                                      key={event.id}
                                      onClick={() => {
                                        field.onChange(event.id);
                                        setSearchQuery(event.name);
                                      }}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                                    >
                                      <div className="flex flex-col flex-1 min-w-0 text-left">
                                        <span className="truncate">{event.name}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                  No results found
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pub_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe the theme or publicity style you want. For example: 'Modern and minimalist design with blue and white color scheme'"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pub_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Specify what needs to be shown in the publicity material. For example: 'Event URL, date, time, venue, registration link, and contact information'"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caption</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Write the caption that will be used when posting to social media platforms. Include relevant hashtags and mentions."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Request...
                    </>
                  ) : (
                    "Create Request"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {request.requester_name}{"'s Request"}
                </CardTitle>
                <CardDescription>
                  {request.requester_email}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {/* Date Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Request Created</span>
                    </div>
                    <span>{format(new Date(request.created_at), "PPP")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Posting Date</span>
                    </div>
                    <span>{format(new Date(request.posting_date), "PPP")}</span>
                  </div>
                </div>

                {/* Publicity Head Selection */}
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Publicity Head</h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {request.pub_head ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {request.pub_head_name?.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{request.pub_head_name}</span>
                          </div>
                        ) : (
                          "Assign Publicity Head"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Search members..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="ml-2 p-1 hover:bg-accent rounded-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {searchQuery.length < 3 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            Type at least 3 characters to search
                          </div>
                        ) : filteredMembers.length > 0 ? (
                          <div className="p-1">
                            {filteredMembers.map((member) => (
                              <button
                                key={member.id}
                                onClick={() => handleProjectHeadAssign(request.id, member.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                                disabled={assigningHead === request.id}
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {member.full_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col flex-1 min-w-0 text-left">
                                  <span className="truncate">{member.full_name}</span>
                                  <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                                </div>
                                {assigningHead === request.id && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            No results found
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Pub Details with 3-line limit */}
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Details</h4>
                  <p className="text-sm line-clamp-3">
                    {request.pub_details}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      {request.pub_type}
                    </Badge>
                    {request.dimensions && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        {request.dimensions}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary"
                        size="sm"
                        className={`w-full ${statusColorMap[request.pub_status as keyof typeof statusColorMap] || 'bg-gray-500 text-white'} hover:opacity-90`}
                        disabled={updatingStatus === request.id}
                      >
                        {updatingStatus === request.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            {statusLabels[request.pub_status as keyof typeof statusLabels] || request.pub_status}
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => handleStatusChange(request.id, key)}
                          className="flex items-center justify-between"
                        >
                          <Badge 
                            variant="secondary" 
                            className={`ml-2 ${statusColorMap[key as keyof typeof statusColorMap] || 'bg-gray-500 text-white'}`}
                          >
                            {label}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Drive Link */}
                {request.pub_drive_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        `https://drive.google.com/drive/folders/${request.pub_drive_id}`,
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Drive
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 