import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import EventList from "@/components/dashboard-events";
import { Event } from "@/app/types";

const events: Event[] = [
  {
    id: "evt_ga_2025",
    arn: "ACADS-001",
    name: "CS General Assembly",
    committee: "ACADS",
    committeeId: 1,
    startTime: "2025-05-10T10:00:00Z",
    endTime: "2025-05-10T12:00:00Z",
    type: "Assembly",
    nature: "Internal",
    duration: "2 hours",
    eventVisual: "/placeholder.svg",
    eventPostCaption: "Join us for a celebration of our CS community!",
    attendanceForm: "https://forms.gle/fake-attendance",
    preregistrationForm: "https://forms.gle/fake-prereg",
    customLinks: [
      {
        title: "Feedback Form",
        url: "https://forms.gle/fake-feedback",
      },
    ],
    createdAt: "2025-04-01T08:00:00Z",
    updatedAt: "2025-04-02T08:00:00Z",
  },
  {
    id: "evt_webdev_2025",
    arn: "RD-001",
    name: "Web Development Bootcamp",
    committee: "Research and Development",
    committeeId: 2,
    startTime: "2025-06-01T13:00:00Z",
    endTime: "2025-06-01T17:00:00Z",
    type: "Workshop",
    nature: "Public",
    duration: "4 hours",
    eventVisual: "/placeholder.svg",
    eventPostCaption: "Learn HTML, CSS, and JavaScript in this beginner-friendly workshop.",
    attendanceForm: "https://forms.gle/bootcamp-attendance",
    preregistrationForm: "https://forms.gle/bootcamp-prereg",
    customLinks: [
      {
        title: "Workshop Materials",
        url: "https://drive.google.com/fake-workshop-materials",
      }
    ],
    createdAt: "2025-04-15T08:00:00Z",
    updatedAt: "2025-04-16T08:00:00Z",
  },
  {
    id: "evt_hackathon_2025",
    arn: "RD-002",
    name: "Annual Hackathon",
    committee: "Research and Development",
    committeeId: 2,
    startTime: "2025-07-15T09:00:00Z",
    endTime: "2025-07-16T17:00:00Z",
    type: "Competition",
    nature: "Public",
    duration: "32 hours",
    eventVisual: "/placeholder.svg",
    eventPostCaption: "Code, Create, and Compete in our biggest hackathon of the year!",
    attendanceForm: "https://forms.gle/hackathon-attendance",
    preregistrationForm: "https://forms.gle/hackathon-prereg",
    customLinks: [
      {
        title: "Problem Statements",
        url: "https://drive.google.com/fake-problems",
      },
      {
        title: "Submission Portal",
        url: "https://hackathon.fake-submit.com",
      }
    ],
    createdAt: "2025-05-01T08:00:00Z",
    updatedAt: "2025-05-02T08:00:00Z",
  },
  {
    id: "evt_career_2025",
    arn: "PROF-001",
    name: "Tech Career Fair",
    committee: "Professional Development",
    committeeId: 3,
    startTime: "2025-08-20T10:00:00Z",
    endTime: "2025-08-20T16:00:00Z",
    type: "Career Fair",
    nature: "Public",
    duration: "6 hours",
    eventVisual: "/placeholder.svg",
    eventPostCaption: "Connect with top tech companies and explore career opportunities!",
    attendanceForm: "https://forms.gle/career-fair-attendance",
    preregistrationForm: "https://forms.gle/career-fair-prereg",
    customLinks: [
      {
        title: "Company List",
        url: "https://drive.google.com/fake-companies",
      },
      {
        title: "Resume Workshop",
        url: "https://forms.gle/fake-resume-workshop",
      }
    ],
    createdAt: "2025-06-01T08:00:00Z",
    updatedAt: "2025-06-02T08:00:00Z",
  },
  {
    id: "evt_ai_2025",
    arn: "RD-003",
    name: "AI and Machine Learning Symposium",
    committee: "Research and Development",
    committeeId: 2,
    startTime: "2025-09-10T09:00:00Z",
    endTime: "2025-09-10T17:00:00Z",
    type: "Conference",
    nature: "Public",
    duration: "8 hours",
    eventVisual: "/placeholder.svg",
    eventPostCaption: "Explore the latest developments in AI and ML with industry experts",
    attendanceForm: "https://forms.gle/ai-symposium-attendance",
    preregistrationForm: "https://forms.gle/ai-symposium-prereg",
    customLinks: [
      {
        title: "Speaker Profiles",
        url: "https://drive.google.com/fake-speakers",
      },
      {
        title: "Research Papers",
        url: "https://drive.google.com/fake-papers",
      }
    ],
    createdAt: "2025-07-01T08:00:00Z",
    updatedAt: "2025-07-02T08:00:00Z",
  }
];

export { events };

export default function Dashboard() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 md:px-6">
              <SectionCards />
              <div className="text-3xl font-bold">Your events</div>
              <EventList events={events} participants={[]} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
