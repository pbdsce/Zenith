"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Github, Linkedin, Download, Code, Shield, Award, Database } from "lucide-react"
import type { Profile } from "../../lib/types"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

interface ProfileModalProps {
  profile: Profile // Removed the null type
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ profile, isOpen, onClose }: ProfileModalProps) {
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
  
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-gray-900 border border-[#0ff]/30 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 shadow-[0_0_30px_rgba(0,255,255,0.3)] scrollbar-thin"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 255, 255, 0.3) transparent',
              msOverflowStyle: 'none'  // Hide scrollbar arrows in IE/Edge
            }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <style jsx>{`
              /* Hide scrollbar arrows in Chrome, Safari, and newer browsers */
              .modal-content::-webkit-scrollbar-button {
                display: none;
              }
            `}</style>

            {/* Close button */}
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white z-50" onClick={onClose}>
              <X size={24} />
            </button>

            {/* Header */}
            <div className="relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0ff]/20 to-transparent h-32" />

              <div className="pt-8 px-8 pb-4 relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* Profile image */}
                <div className="w-28 h-28 rounded-full border-4 border-[#0ff] shadow-[0_0_15px_rgba(0,255,255,0.5)] overflow-hidden flex-shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#0ff] relative">
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

                {/* Basic info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-1">{profile.name}</h2>
                  <p className="text-xl text-gray-300 mb-3">{profile.college}</p>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {profile.githubLink && (
                      <a
                        href={profile.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-full text-sm transition-colors"
                      >
                        <Github size={16} className="text-[#0ff]" />
                        <span>GitHub</span>
                      </a>
                    )}

                    {profile.linkedinLink && (
                      <a
                        href={profile.linkedinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-full text-sm transition-colors"
                      >
                        <Linkedin size={16} className="text-[#0ff]" />
                        <span>LinkedIn</span>
                      </a>
                    )}

                    {profile.portfolioLink && (
                      <a
                        href={profile.portfolioLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-full text-sm transition-colors"
                      >
                        <ExternalLink size={16} className="text-[#0ff]" />
                        <span>Portfolio</span>
                      </a>
                    )}

                    {profile.resumeLink && (
                      <a
                        href={profile.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-[#0a3333] hover:bg-[#0a4444] text-white px-3 py-1.5 rounded-full text-sm transition-colors"
                      >
                        <Download size={16} className="text-[#0ff]" />
                        <span>Resume</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Content */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left column */}
              <div className="md:col-span-2 space-y-6">
                {/* Bio */}
                <div>
                  <h3 className="text-xl font-semibold text-[#0ff] mb-3">About</h3>
                  <p className="text-gray-300 leading-relaxed">{profile.shortBio}</p>
                </div>

                {/* Competitive Programming */}
                {((profile.cpProfiles && profile.cpProfiles.length > 0) || profile.leetcodeProfile) && (
                  <div>
                    <h3 className="text-xl font-semibold text-[#0ff] mb-3 flex items-center gap-2">
                      <Code className="text-[#0ff]" size={20} />
                      Competitive Programming
                    </h3>

                    <div className="space-y-4">
                      {profile.leetcodeProfile && (
                        <a
                          href={profile.leetcodeProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-800 p-3 rounded-lg transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#0ff]/10 flex items-center justify-center">
                            <span className="text-[#0ff] font-bold">LC</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white">LeetCode</h4>
                            <p className="text-sm text-gray-400">View coding challenges and solutions</p>
                          </div>
                          <ExternalLink size={16} className="ml-auto text-gray-500" />
                        </a>
                      )}

                      {profile.cpProfiles && profile.cpProfiles.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {profile.cpProfiles.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-800 p-3 rounded-lg transition-colors"
                            >
                              <div className="w-10 h-10 rounded-lg bg-[#0ff]/10 flex items-center justify-center">
                                <span className="text-[#0ff] font-bold">CP</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-white">CP Profile {index + 1}</h4>
                                <p className="text-sm text-gray-400 truncate max-w-[150px]">{link}</p>
                              </div>
                              <ExternalLink size={16} className="ml-auto text-gray-500" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CTF Profiles */}
                {profile.ctfProfileLinks && profile.ctfProfileLinks.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-[#0ff] mb-3 flex items-center gap-2">
                      <Shield className="text-[#0ff]" size={20} />
                      Capture The Flag
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profile.ctfProfileLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-800 p-3 rounded-lg transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#0a3333] flex items-center justify-center">
                            <span className="text-[#0ff] font-bold">CTF</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white">CTF Profile {index + 1}</h4>
                            <p className="text-sm text-gray-400 truncate max-w-[150px]">{link}</p>
                          </div>
                          <ExternalLink size={16} className="ml-auto text-gray-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Science */}
                {profile.kaggleLink && (
                  <div>
                    <h3 className="text-xl font-semibold text-[#0ff] mb-3 flex items-center gap-2">
                      <Database className="text-[#0ff]" size={20} />
                      Data Science
                    </h3>

                    <a
                      href={profile.kaggleLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-800 p-3 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#0ff]/10 flex items-center justify-center">
                        <span className="text-[#0ff] font-bold">K</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Kaggle</h4>
                        <p className="text-sm text-gray-400">View data science projects and competitions</p>
                      </div>
                      <ExternalLink size={16} className="ml-auto text-gray-500" />
                    </a>
                  </div>
                )}

                {/* Hackathons */}
                {profile.devfolioLink && (
                  <div>
                    <h3 className="text-xl font-semibold text-[#0ff] mb-3 flex items-center gap-2">
                      <Award className="text-[#0ff]" size={20} />
                      Hackathons
                    </h3>

                    <a
                      href={profile.devfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-800 p-3 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#0ff]/10 flex items-center justify-center">
                        <span className="text-[#0ff] font-bold">D</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Devfolio</h4>
                        <p className="text-sm text-gray-400">View hackathon projects and achievements</p>
                      </div>
                      <ExternalLink size={16} className="ml-auto text-gray-500" />
                    </a>
                  </div>
                )}
              </div>

              {/* Right column - Contact info */}
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-xl p-5">
                  <h3 className="text-xl font-semibold text-[#0ff] mb-4">Contact Information</h3>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-gray-400 text-sm">Email</h4>
                      <p className="text-white break-words">{profile.email}</p>
                    </div>

                    <div>
                      <h4 className="text-gray-400 text-sm">Age</h4>
                      <p className="text-white">{profile.age}</p>
                    </div>

                    <div>
                      <h4 className="text-gray-400 text-sm">College/University</h4>
                      <p className="text-white break-words">{profile.college}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a3333] rounded-xl p-5 border border-[#0ff]/20">
                  <h3 className="text-lg font-semibold text-[#0ff] mb-2">Upvotes</h3>
                  <p className="text-4xl font-bold text-white">{profile.upvotes}</p>
                  <p className="text-gray-400 text-sm mt-1">from the community</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

