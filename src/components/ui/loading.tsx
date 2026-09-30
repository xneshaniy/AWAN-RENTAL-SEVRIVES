import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />
}

export function FullPageLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner className="h-10 w-10" />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />
}
