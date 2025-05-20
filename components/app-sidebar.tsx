"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  IconDashboard,
  IconHelp,
  IconSettings,
  IconChevronDown,
  IconUpload,
  IconFileText,
  IconLink,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandSpotify,
  IconBrandGoogleDrive,
  IconFileDescription,
  IconClipboardCheck,
  type Icon,
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
  SidebarGroup,
  SidebarGroupLabel,
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
];

const activityTools = [
  {
    name: "Publicity Requests",
    url: "/publicity-requests",
    icon: IconFileDescription,
  },
  {
    name: "Permit Requests",
    url: "/permit-requests",
    icon: IconClipboardCheck,
  },
  {
    name: "Manage Links",
    url: "/manage-links",
    icon: IconLink,
  },
];

const platforms = [
  {
    name: "Facebook Page",
    url: "/platforms/facebook-page",
    icon: IconBrandFacebook,
  },
  {
    name: "Facebook Group",
    url: "/platforms/facebook-group",
    icon: IconBrandFacebook,
  },
  {
    name: "Instagram",
    url: "/platforms/instagram",
    icon: IconBrandInstagram,
  },
  {
    name: "Youtube",
    url: "/platforms/youtube",
    icon: IconBrandYoutube,
  },
  {
    name: "Spotify",
    url: "/platforms/spotify",
    icon: IconBrandSpotify,
  },
  {
    name: "Google Drive",
    url: "/platforms/google-drive",
    icon: IconBrandGoogleDrive,
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
];

const documents = [
  {
    name: "Data Library",
    url: "/data-library",
    icon: IconFileText,
  },
  {
    name: "Reports",
    url: "/reports",
    icon: IconFileText,
  },
  {
    name: "Word Assistant",
    url: "/word-assistant",
    icon: IconFileText,
  },
];

function NavPlatforms({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon: Icon;
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Platforms</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

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
        <NavDocuments items={activityTools} />
        <NavPlatforms items={platforms} />
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
