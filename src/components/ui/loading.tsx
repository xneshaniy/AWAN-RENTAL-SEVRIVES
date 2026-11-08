import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />
}

export function FullPageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
      <LoadingSpinner className="h-10 w-10 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-muted", className)} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-lg bg-muted",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

export function VehicleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full", className)}>
      <div className="h-48 bg-muted" />
      <div className="p-4">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
        <div className="mt-4">
          <div className="h-8 bg-muted rounded w-full" />
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)}>
      <div className="h-4 bg-muted rounded w-1/3" />
      <div className="space-y-4">
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
      </div>
    </div>
  )
}