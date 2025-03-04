'use client'

import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpIcon as SendArrow, Linkedin, createLucideIcon, Instagram } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useState } from "react";
import pblogo from "@/public/images/pblogo-nobg.png"
import pbfull from "@/public/images/pbfulllogo.svg"

const XIcon = createLucideIcon("X", [
    [
      "path",
      {
        d: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
        stroke: "none",
        fill: "currentColor",
      },
    ],
  ]);

export function SpaceFooter() {
  const [message, setMessage] = useState('');

  return (
    <footer className="relative flex items-end w-full h-[50vh] text-white overflow-hidden pb-10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute flex w-full  top-0 rounded-[100%] blur-3xl transform translate-y-[-50%]"></div>
        <div className="absolute inset-0"></div>
        <div className="absolute inset-0 bg-[url('/images/footerbg2.png')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
            </div>
            <div className="space-y-2">
              <Image src={pblogo.src} alt="pblogo" width={65} height={65}/>
              <p className="text-gray-400 text-lg">zenith@pointblank.club</p>
            </div>
          </div>

          {/* Middle column - Quick Links */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Quick Links</h3>
              <div className="space-y-4">
                <Link href="https://www.pointblank.club/leads" className="block text-gray-400 hover:text-white transition-colors">
                  Leads
                </Link>
                <Link href="https://www.pointblank.club/events" className="block text-gray-400 hover:text-white transition-colors">
                  Events
                </Link>
              </div>
            </div>
            <div className="space-y-6 pt-12">
              <div className="space-y-4">
                <Link href="https://www.pointblank.club/members" className="block text-gray-400 hover:text-white transition-colors">
                  Members
                </Link>
                <Link href="https://www.pointblank.club/achievements" className="block text-gray-400 hover:text-white transition-colors">
                  Achievements
                </Link>
              </div>
            </div>
          </div>

          {/* Right column - Subscribe */}
          <div className="space-y-6">
          <h3 className="text-lg font-medium">Reach us out on WhatsApp</h3>
            <div className="space-y-3">
              <Input
              type="text"
              placeholder="Your message"
              id="whatsapp-message"
              className="bg-white/10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              />
              <Link
              href={`https://wa.me/8140724216?text=${encodeURIComponent(message || 'Hi Point Blank!')}`}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md w-full flex items-center justify-center"
              >
              <span className="mr-2">Send Message</span>
              <SendArrow className="h-4 w-4 text-white" />
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-800 my-4"></div>

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-4 mb-6 md:mb-0">
            <Link href="https://www.linkedin.com/company/point-blank-d/" className="bg-gray-900 p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link href="https://x.com/pointblank_dsce" className="bg-gray-900 p-2 rounded-full hover:bg-gray-800 transition-colors">
              <XIcon className="h-5 w-5" />
            </Link>
            <Link href="https://www.instagram.com/pointblank_dsce/" className="bg-gray-900 p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Instagram className="h-5 w-5" />
            </Link>
          </div>
          <div className="text-center md:text-left mb-6 md:mb-0">
            <p className="text-gray-400 flex items-center">A <Image className="mx-3 mb-[0.2rem]" src={pbfull.src} alt="pblogo" width={150} height={100}/> EVENT</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

