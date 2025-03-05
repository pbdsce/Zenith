import React from 'react';
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
  onClose,
}) => {
  const { title, category, description, fullDescription, time, image } = event;

  if (isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-3xl bg-black/40 border border-heading/50 rounded-xl overflow-hidden max-h-[90vh] md:max-h-[80vh] flex flex-col"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
          <img
            src={image}
            alt={title}
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors border border-heading/30"
              aria-label="Close"
            >
              <X size={24} className="text-heading" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto scrollbar-hide flex-grow">
          <div className="mb-1 font-medium text-heading/80">{category}</div>
          <h3 className="text-3xl font-bold mb-2 font-dystopian text-heading">{title}</h3>
          <div className="mb-4 text-sm bg-heading/10 inline-block px-3 py-1 rounded-full text-heading">
            {time}
          </div>
          <p className="mb-4 text-gray-300">{description}</p>
          <p className="text-gray-400">{fullDescription}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      animate={{ opacity: isFaded ? 0.5 : 1 }}
      onClick={onExpand}
      className="bg-black/30 backdrop-blur-sm border border-heading/30 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-heading/20 transition-all"
    >
      <div className="h-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="mb-1 font-medium text-xs text-heading/70">{category}</div>
        <h3 className="text-xl font-dystopian font-bold mb-1 text-heading">{title}</h3>
        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{description}</p>
        <div className="text-xs bg-heading/10 inline-block px-2 py-1 rounded-full text-heading">
          {time}
        </div>
      </div>
    </motion.div>
  );
};

export default EventBox;