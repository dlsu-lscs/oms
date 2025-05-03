import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";

export default function EventCard() {
  return (
    <div className="max-w-xs overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src="/placeholder.svg?height=400&width=600"
          alt="Event visual"
          fill
          className="rounded-md object-cover"
        />
        <Badge variant="secondary" className="absolute left-2 top-2 text-xs">
          Research and Development
        </Badge>
      </div>

      <div className="flex flex-row py-2">
        <div className="flex flex-grow flex-col items-start justify-between">
          <div className="flex flex-row">
            <h3 className="text-xl font-semibold">Web Development Basics</h3>
          </div>
          <div className="flex items-center gap-2 text-sm justify-items-center">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Pre-Acts deadline on July 25, 2025
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Manage event">
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
