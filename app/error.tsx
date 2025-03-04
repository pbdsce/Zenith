'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Monoton } from 'next/font/google'

const mon = Monoton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap'
})

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <motion.h1 
          className={`${mon.className} text-4xl md:text-6xl text-red-500 mb-8`}
        >
          Something went wrong!
        </motion.h1>
        <button
          onClick={reset}
          className="bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-2 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
