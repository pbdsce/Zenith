"use client"

import { motion } from "framer-motion"
import { Search, SortAsc } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { StarsBackground } from "./stars-background"

interface SearchBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: "name" | "upvotes"
  setSortBy: (sort: "name" | "upvotes") => void
}

export default function SearchBar({ searchTerm, setSearchTerm, sortBy, setSortBy }: SearchBarProps) {
  return (
    <>
      <StarsBackground/>
    <motion.div
      className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, college, or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-transparent text-white focus:ring-[#0ff]  w-full"
            />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-300 flex items-center gap-1">
            <SortAsc className="h-4 w-4" /> Sort by:
          </span>
          <ToggleGroup
            type="single"
            value={sortBy}
            onValueChange={(value) => value && setSortBy(value as "name" | "upvotes")}
            >
            <ToggleGroupItem value="name" className="data-[state=on]:bg-[#0ff] data-[state=on]:text-black">
              Name
            </ToggleGroupItem>
            <ToggleGroupItem value="upvotes" className="data-[state=on]:bg-[#0ff] data-[state=on]:text-black">
              Upvotes
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </motion.div>
    </>
  )
}

