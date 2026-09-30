import Image from "next/image"
import Link from "next/link"
import { Users, Fuel, Settings } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

export interface Vehicle {
  id: string
  name: string
  category: string
  year: number
  seats: number
  transmission: string
  fuelType: string
  dailyRate: number
  image: string
  featured?: boolean
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full bg-muted">
        {vehicle.featured && (
          <Badge className="absolute top-2 right-2 z-10" variant="warning">
            Featured
          </Badge>
        )}
        <Image
          src={vehicle.image || "/placeholder-car.jpg"}
          alt={vehicle.name}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg">{vehicle.name}</h3>
            <p className="text-sm text-muted-foreground">{vehicle.year}</p>
          </div>
          <Badge variant="outline">{vehicle.category}</Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center flex-col gap-1">
            <Users className="h-4 w-4" />
            <span>{vehicle.seats} Seats</span>
          </div>
          <div className="flex items-center flex-col gap-1">
            <Settings className="h-4 w-4" />
            <span>{vehicle.transmission}</span>
          </div>
          <div className="flex items-center flex-col gap-1">
            <Fuel className="h-4 w-4" />
            <span>{vehicle.fuelType}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t mt-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Daily Rate</p>
          <p className="font-bold text-lg text-primary">PKR {vehicle.dailyRate.toLocaleString()}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="sm" asChild>
            <Link href={`/book?vehicleId=${vehicle.id}`}>Book Now</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/vehicles/${vehicle.id}`}>View Details</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
