"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, Info } from "lucide-react"

export default function CountdownTimer() {
  const [endDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date
  })

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return (
    <motion.div
      className="bg-gray-900/70 backdrop-blur-sm border border-[#0ff]/30 rounded-full px-4 py-2 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.2)] mx-70 w-fit"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Clock className="text-[#0ff] h-4 w-4" />
      <div className="text-white font-medium">
        Screening ends in:
        <span className="ml-2 font-mono text-[#ff00ff]">
          {String(timeLeft.days).padStart(2, "0")}d :{String(timeLeft.hours).padStart(2, "0")}h :
          {String(timeLeft.minutes).padStart(2, "0")}m :{String(timeLeft.seconds).padStart(2, "0")}s
        </span>
      </div>
    </motion.div>
  )
}

