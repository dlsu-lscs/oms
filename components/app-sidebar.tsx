"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconHelp,
  IconLink,
  IconListDetails,
  IconReport,
  IconReportAnalytics,
  IconSearch,
  IconSettings,
  IconUsers,
  IconChevronDown,
  IconUpload,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconDashboard,
  },
  {
    title: "Events",
    url: "/events",
    icon: IconListDetails,
  },
  {
    title: "Links",
    url: "/links",
    icon: IconLink,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: IconReportAnalytics,
  },
  {
    title: "Team",
    url: "/team",
    icon: IconUsers,
  },
];

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
  },
  {
    title: "Get Help",
    url: "/help",
    icon: IconHelp,
  },
  {
    title: "Search",
    url: "/search",
    icon: IconSearch,
  },
];

const documents = [
  {
    name: "Data Library",
    url: "/data-library",
    icon: IconDatabase,
  },
  {
    name: "Reports",
    url: "/reports",
    icon: IconReport,
  },
  {
    name: "Word Assistant",
    url: "/word-assistant",
    icon: IconFileWord,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
            <SidebarMenuButton
                  className="data-[slot=sidebar-menu-button]:!p-1.5 flex items-center justify-between w-full"
            >
                <span className="text-base font-semibold">
                  La Salle Computer Society
                </span>
                  <IconChevronDown className="w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem asChild>
                  <Link href="/bulk-upload-events" className="flex items-center gap-2">
                    <IconUpload className="w-4 h-4" />
                    Start a new term
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <IconSettings className="w-4 h-4" />
                    Organization Settings
              </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser 
          user={{
            name: session?.user?.name || "Guest",
            email: session?.user?.email || "",
            avatar: session?.user?.image || "/avatars/default.jpg",
            nickname: session?.user?.nickname || null,
          }}
          onSignOut={handleSignOut}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
