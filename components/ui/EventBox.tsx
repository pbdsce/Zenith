import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Event } from '../types';

interface EventBoxProps {
  event: Event;
  isExpanded: boolean;
  isFaded: boolean;
  onExpand: () => void;
  onClose: () => void;
}

const EventBox: React.FC<EventBoxProps> = ({
  event,
  isExpanded,
  isFaded,
  onExpand,
  onClose
}) => {
  if (isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl border border-cyan-400/50 overflow-hidden shadow-lg shadow-cyan-500/20 w-full max-w-4xl max-h-[90vh]"
      >
        <div className="relative h-full flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="overflow-auto flex-grow p-6 scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-transparent">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={event.image}
                    alt={event.title}
                    width={400}
                    height={400}
                    className="object-cover"
                  />
                </div>
                
                <div className="mt-4 space-y-3 text-cyan-300">
                  <p><span className="font-bold">Time:</span> {event.time}</p>
                </div>
              </div>
              
              <div className="md:w-2/3">
                <h2 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">{event.title}</h2>
                <p className="text-cyan-300 text-lg mb-6">{event.category}</p>
                <div className="text-gray-100 space-y-4">
                  <p className="leading-relaxed">{event.fullDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onExpand}
      className={`rounded-xl border border-cyan-400/50 overflow-hidden shadow-lg shadow-cyan-500/20 bg-black bg-opacity-50 backdrop-blur-md transition-all cursor-pointer h-full
        ${isFaded ? 'opacity-30 scale-95 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative h-48">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-2xl font-bold text-cyan-400">{event.title}</h3>
          <p className="text-cyan-300">{event.category}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-200 mb-4">{event.description}</p>
        <div className="flex justify-between text-cyan-300 text-sm">
          <span>{event.time}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default EventBox;