import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Publicity Requests",
  description: "Manage publicity requests for events and other purposes",
}

export default function PublicityRequestsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 