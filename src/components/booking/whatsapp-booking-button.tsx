"use client"
import * as React from "react"
import { Button } from "@/components/ui/Button"
import { MessageCircle } from "lucide-react"
import { getWhatsAppLink, WHATSAPP_NUMBER } from "@/config/site"

export interface WhatsAppBookingButtonProps {
  bookingDetails: any
  reference: string
}

export function WhatsAppBookingButton({ bookingDetails, reference }: WhatsAppBookingButtonProps) {
  const generateMessage = () => {
    const msg = `*New Booking Request: ${reference}*\n\n` +
      `*Name:* ${bookingDetails.name}\n` +
      `*Phone:* ${bookingDetails.phone}\n` +
      `*Rental Type:* ${bookingDetails.rentalType}\n` +
      `*Vehicle:* ${bookingDetails.vehicleId}\n` +
      `*Pickup:* ${bookingDetails.pickupLocation} on ${bookingDetails.pickupDate}\n` +
      `*Drop-off:* ${bookingDetails.dropoffLocation} on ${bookingDetails.returnDate}\n` +
      `*Passengers:* ${bookingDetails.passengers}\n` +
      (bookingDetails.specialRequests ? `*Notes:* ${bookingDetails.specialRequests}` : "")

    return msg
  }

  if (!WHATSAPP_NUMBER) return null

  const href = getWhatsAppLink(generateMessage())
  if (!href) return null

  return (
    <Button variant="whatsapp" className="w-full sm:w-auto" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="mr-2 h-4 w-4" />
        Send Booking on WhatsApp
      </a>
    </Button>
  )
}
