"use client"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

export function TooltipTest() {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-center p-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="rounded bg-blue-500 px-4 py-2 text-white">Hover me</button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a simple test tooltip</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
