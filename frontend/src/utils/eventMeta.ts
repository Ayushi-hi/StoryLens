import type { EventType } from "@/types/analytics"

export const EVENT_LABELS: Record<EventType, string> = {
  view: "Views",
  cart: "Cart adds",
  remove_from_cart: "Removed from cart",
  purchase: "Purchases",
}

export const EVENT_COLORS: Record<EventType, string> = {
  view: "#3b82f6",
  cart: "#8b5cf6",
  remove_from_cart: "#f59e0b",
  purchase: "#14b8a6",
}