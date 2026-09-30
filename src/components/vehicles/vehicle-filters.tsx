"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/select"

export function VehicleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
      <Input 
        placeholder="Search vehicles..." 
        defaultValue={searchParams.get("q") || ""}
        onChange={(e) => handleFilterChange("q", e.target.value)}
      />
      <Select 
        options={[
          { label: "All Categories", value: "" },
          { label: "Economy", value: "economy" },
          { label: "Sedan", value: "sedan" },
          { label: "SUV", value: "suv" },
          { label: "Luxury", value: "luxury" }
        ]}
        defaultValue={searchParams.get("category") || ""}
        onChange={(e) => handleFilterChange("category", e.target.value)}
      />
      <Select 
        options={[
          { label: "All Transmissions", value: "" },
          { label: "Automatic", value: "automatic" },
          { label: "Manual", value: "manual" }
        ]}
        defaultValue={searchParams.get("transmission") || ""}
        onChange={(e) => handleFilterChange("transmission", e.target.value)}
      />
      <Select 
        options={[
          { label: "All Fuel Types", value: "" },
          { label: "Petrol", value: "petrol" },
          { label: "Diesel", value: "diesel" },
          { label: "Hybrid", value: "hybrid" }
        ]}
        defaultValue={searchParams.get("fuelType") || ""}
        onChange={(e) => handleFilterChange("fuelType", e.target.value)}
      />
    </div>
  )
}
