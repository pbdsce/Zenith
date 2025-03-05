'use client'
import { motion } from 'framer-motion';
import Image from 'next/image';
import QRsolve from "@/public/images/qrcode.webp"
import CTF from "@/public/images/ctf.webp"
import Help from "@/public/images/tusharctflol.webp"


interface EventCard {
  title: string;
  description: string;
  imageUrl: string;
}

const events: EventCard[] = [
  {
    title: "PBCTF 3.0",
    description: "",
    imageUrl: CTF.src
  },
  {
    title: "PBCTF 3.0",
    description: "",
    imageUrl: QRsolve.src
  },
  {
    title: "PBCTF 3.0",
    description: "",
    imageUrl: Help.src
  }
];

export function Gallery() {
  return (
    <section className="w-full py-24 min-h-screen bg-transparent">
      <div className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ 
            y: -50, 
            opacity: 0,
            filter: "drop-shadow(0 0 15px rgba(0, 246, 255, 0.2))",
        }}
        animate={{
            filter: "drop-shadow(0 0 20px rgba(0, 246, 255, 0.3))",
            transition: {
                duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }
        }}
        whileInView={{ 
            y: 0, 
            opacity: 1,
        }}
        viewport={{ once: true }}
        className="text-5xl md:text-7xl mb-7 md:mb-20 text-heading font-dystopian font-bold text-center gradient-text"
        style={{
            textShadow: [
              "0 0 20px rgba(0, 246, 255, 0.3)",
              "0 0 40px rgba(0, 246, 255, 0.2)",
              "0 0 60px rgba(0, 246, 255, 0.1)",
            ].join(', ')
        }}
        >
          Previous Events
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {events.map((event, index) => (
              <motion.div 
              key={index}
              className="group relative h-[300px] rounded-lg overflow-hidden"
              initial={{ 
                  filter: "drop-shadow(0 0 10px rgba(0, 246, 255, 0.15))"
                }}
                animate={{
                    filter: "drop-shadow(0 0 10px rgba(0, 246, 255, 0.15))",
                    transition: {
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }
                }}
                whileHover={{
                    filter: "drop-shadow(0 0 25px rgba(0, 246, 255, 0.4))",
                transition: { duration: 0.2 }
              }}
            >
              <div className="relative w-full h-full [clip-path:polygon(15%_0,_80%_0%,_100%_0,_100%_85%,_85%_99%,_20%_100%,_0_100%,_0_16%)]">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-all duration-300 group-hover:scale-105"
                  priority={index < 2}
                  />
              </div>
              <div 
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-6 transition-all duration-300 [clip-path:polygon(15%_0,_80%_0%,_100%_0,_100%_85%,_85%_99%,_20%_100%,_0_100%,_0_16%)]"
                >
                <h3 
                  className="text-xl font-bold text-white mb-2 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{
                      textShadow: [
                          "0 0 20px rgba(0, 246, 255, 0.3), 0 0 40px rgba(0, 246, 255, 0.2)",
                          "0 0 30px rgba(0, 246, 255, 0.5), 0 0 60px rgba(0, 246, 255, 0.3)",
                          "0 0 20px rgba(0, 246, 255, 0.3), 0 0 40px rgba(0, 246, 255, 0.2)",
                        ].join(', ')
                    }}
                    >
                  {event.title}
                </h3>
                <p className="text-gray-200 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                  {event.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}