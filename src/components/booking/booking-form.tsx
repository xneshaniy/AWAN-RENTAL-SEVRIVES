"use client"
import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/Button"
import { WhatsAppBookingButton } from "./whatsapp-booking-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

const bookingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  vehicleId: z.string().min(1, "Please select a vehicle"),
  rentalType: z.string().min(1, "Please select rental type"),
  pickupLocation: z.string().min(2, "Pickup location is required"),
  dropoffLocation: z.string().min(2, "Drop-off location is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  returnDate: z.string().min(1, "Return date is required"),
  passengers: z.string().min(1, "Number of passengers is required"),
  specialRequests: z.string().optional(),
})

type BookingFormValues = z.infer<typeof bookingSchema>

export function BookingForm({ initialVehicleId }: { initialVehicleId?: string }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [bookingRef, setBookingRef] = React.useState<string | null>(null)
  const [submittedData, setSubmittedData] = React.useState<BookingFormValues | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      vehicleId: initialVehicleId || "",
    }
  })

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    const ref = `AWN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setBookingRef(ref)
    setSubmittedData(data)
    setIsSubmitting(false)
  }

  if (bookingRef && submittedData) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Booking Request Received!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your booking reference is: <strong>{bookingRef}</strong></p>
          <p>Please send this booking to us on WhatsApp to confirm your reservation and discuss payment details.</p>
          <WhatsAppBookingButton bookingDetails={submittedData} reference={bookingRef} />
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto bg-card p-6 rounded-xl border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Full Name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Phone/WhatsApp" error={errors.phone?.message} {...register("phone")} />
        
        <Select 
          label="Rental Type" 
          error={errors.rentalType?.message}
          options={[
            { label: "Select Type", value: "" },
            { label: "Self-Drive", value: "self-drive" },
            { label: "With Driver", value: "with-driver" },
            { label: "Airport Transfer", value: "airport-transfer" },
            { label: "Corporate", value: "corporate" }
          ]}
          {...register("rentalType")} 
        />
        
        <Input label="Pickup Location" error={errors.pickupLocation?.message} {...register("pickupLocation")} />
        <Input label="Drop-off Location" error={errors.dropoffLocation?.message} {...register("dropoffLocation")} />
        
        <Input label="Pickup Date & Time" type="datetime-local" error={errors.pickupDate?.message} {...register("pickupDate")} />
        <Input label="Return Date & Time" type="datetime-local" error={errors.returnDate?.message} {...register("returnDate")} />
        
        <Input label="Number of Passengers" type="number" error={errors.passengers?.message} {...register("passengers")} />
        
        {/* Simplified vehicle selection for demo */}
        <Select 
          label="Vehicle" 
          error={errors.vehicleId?.message}
          options={[
            { label: "Select Vehicle", value: "" },
            { label: "Toyota Corolla", value: "corolla" },
            { label: "Honda Civic", value: "civic" },
            { label: "Toyota Fortuner", value: "fortuner" },
          ]}
          {...register("vehicleId")} 
        />
      </div>
      
      <Textarea label="Special Requests (Optional)" error={errors.specialRequests?.message} {...register("specialRequests")} />
      
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Submit Booking Request
      </Button>
    </form>
  )
}
