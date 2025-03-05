'use client'

import { motion } from 'framer-motion'
import { Monoton } from 'next/font/google'
import { BarLoader } from 'react-spinners'

const mon = Monoton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap'
})

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <motion.h1 
          className={`font-dystopian text-4xl md:text-7xl text-white`}
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 1, 0.3],
            textShadow: [
              "0 0 20px rgba(0, 246, 255, 0.3)",
              "0 0 40px rgba(0, 246, 255, 0.6)",
              "0 0 20px rgba(0, 246, 255, 0.3)",
            ]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          ZENITH
        </motion.h1>
        <div className="mt-8">
          <BarLoader
            color="white"
            width={280}
            height={4}
          />
        </div>
      </div>
    </div>
  )
}
