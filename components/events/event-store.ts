import { create } from "zustand";
import { Event } from "@/app/types";

interface EventSheetStore {
  isOpen: boolean;
  currentEvent: Event | null;
  openEventSheet: (event: Event) => void;
  closeEventSheet: () => void;
}

export const useEventSheet = create<EventSheetStore>((set) => ({
  isOpen: false,
  currentEvent: null,
  openEventSheet: (event: Event) => set({ isOpen: true, currentEvent: event }),
  closeEventSheet: () => set({ isOpen: false, currentEvent: null }),
})); 