"use client"
import { MessageCircle } from "lucide-react"
import { getWhatsAppLink, WHATSAPP_NUMBER } from "@/config/site"

export function WhatsAppButton() {
  const message = "Hello! I'm interested in renting a car."
  const href = WHATSAPP_NUMBER ? getWhatsAppLink(message) : ""

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 animate-pulse"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}
