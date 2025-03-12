"use client"

import type React from "react"
import { motion } from "framer-motion"
import { ThumbsUp, Github, Linkedin, ExternalLink } from "lucide-react"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import FallbackProfilePic from "@/public/images/catpfp.jpeg"

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

  // Generate a consistent color based on name
  const getColorFromName = (name: string) => {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#FF33A8', 
      '#33FFF5', '#FF5733', '#C733FF', '#FFD133',
      '#8C33FF', '#FF336E', '#33FFEC', '#FF8633'
    ];
    
    // Simple hash function to get a number from the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Get the first letter of user's name or a fallback
  const getInitial = (name: string) => {
    if (!name || name.length === 0) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Check if the profile picture exists and is valid
  const hasValidProfilePicture = Boolean(profile.profile_picture && profile.profile_picture.length > 0);

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
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#0ff] relative">
            {hasValidProfilePicture ? (
              <Image
                src={profile.profile_picture}
                alt={profile.name}
                fill
                className="object-cover"
                unoptimized={typeof profile.profile_picture === 'string' && profile.profile_picture.startsWith('http')}
                onError={(e) => {
                  // On error, show the letter avatar instead
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const letterDiv = document.createElement('div');
                    letterDiv.className = 'w-full h-full flex items-center justify-center text-3xl font-bold text-white';
                    letterDiv.style.backgroundColor = getColorFromName(profile.name || 'User');
                    letterDiv.textContent = getInitial(profile.name || 'User');
                    parent.appendChild(letterDiv);
                  }
                }}
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: getColorFromName(profile.name || 'User') }}
              >
                {getInitial(profile.name || 'User')}
              </div>
            )}
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

