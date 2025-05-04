import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import React from "react";

type EventCardProps = {
  imageSrc?: string;
  altText?: string;
  badgeText: string;
  title: string;
  deadlineText: string;
  onClick?: () => void;
};

export default function EventCard({
  imageSrc = "/placeholder.svg?height=400&width=600",
  altText = "Event visual",
  badgeText,
  title,
  deadlineText,
  onClick,
}: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className="max-w-xs overflow-hidden rounded-lg shadow-sm hover:cursor-pointer hover:bg-accent hover:transition-all hover:duration-100 hover:shadow-md"
    >
      <div className="relative h-48 w-full">
        <Image
          src={imageSrc}
          alt={altText}
          fill
          className="rounded-md object-cover"
        />
        <Badge variant="secondary" className="absolute left-2 top-2 text-xs">
          {badgeText}
        </Badge>
      </div>

      <div className="flex flex-row py-2 px-3">
        <div className="flex flex-grow flex-col items-start justify-between">
          <div className="flex flex-row">
            <h3 className="text-xl font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm justify-items-center">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{deadlineText}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Manage event">
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
