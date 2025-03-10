"use client"

import type React from "react"
import { motion } from "framer-motion"
import { ThumbsUp, Github, Linkedin, ExternalLink } from "lucide-react"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import catpfp from "@/public/images/catpfp.jpeg"

interface ProfileCardProps {
  profile: Profile
  onSelect: () => void
  upvoteProfile: (id: string) => void
  hasUpvoted: boolean
}

export default function ProfileCard({ profile, onSelect, upvoteProfile, hasUpvoted }: ProfileCardProps) {
  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation()
    upvoteProfile(profile.id)
  }

  return (
    <motion.div
      onClick={onSelect}
      className={cn(
        "bg-gray-900/70 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
        "border border-transparent hover:border-[#0ff]/50",
        "shadow-[0_0_10px_rgba(0,255,255,0.2)]",
        "hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]",
      )}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-5 flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#0ff]">
            <img
              src={profile.profilePic || catpfp.src}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{profile.name}</h2>
          <p className="text-gray-400">{profile.college}</p>

          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              {profile.githubLink && (
                <a
                  href={profile.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-[#0ff] transition-colors"
                >
                  <Github size={18} />
                </a>
              )}
              {profile.linkedinLink && (
                <a
                  href={profile.linkedinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-[#0ff] transition-colors"
                >
                  <Linkedin size={18} />
                </a>
              )}
              {profile.portfolioLink && (
                <a
                  href={profile.portfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-[#0ff] transition-colors"
                >
                  <ExternalLink size={18} />
                </a>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={cn("flex items-center gap-1 text-gray-300", hasUpvoted && "text-[#ff00ff]")}
              onClick={handleUpvote}
            >
              <ThumbsUp size={16} className={hasUpvoted ? "fill-[#ff00ff]" : ""} />
              <span>{profile.upvotes}</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

