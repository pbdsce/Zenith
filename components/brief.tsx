'use client'
import React, { useState } from 'react';
import { ChevronDown, Target, Crosshair, Briefcase, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TwinkleBackground } from './ui/twinkle-background';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  questions: FAQItem[];
}

interface FAQData {
  [key: string]: FAQSection;
}

interface MenuItem {
  id: keyof FAQData;
  label: string;
  icon: React.FC<{ className?: string }>;
}

export function Brief() {
  const faqData: FAQData = {
    general: {
      questions: [
        {
          question: "What is Zenith?",
          answer: "Zenith is a technical fest organized by [Your Organization] that brings together technology enthusiasts for competitions, workshops, and learning opportunities."
        },
        {
          question: "When and where is it happening?",
          answer: "The event will take place on [Date] at [Venue]. Mark your calendars!"
        },
        {
          question: "How can I register?",
          answer: "Registration can be done through our website or on-spot at the venue. Early bird registrations get special discounts!"
        }
      ]
    },
    events: {
      questions: [
        {
          question: "What events can I participate in?",
          answer: "We offer various events including CTF, Hackathon, DSA competitions, and Kaggle challenges."
        },
        {
          question: "Are there any prerequisites?",
          answer: "Each event has different requirements. Check individual event pages for specific details."
        }
      ]
    },
    prizes: {
      questions: [
        {
          question: "What are the prizes?",
          answer: "We have exciting prizes including cash rewards, internship opportunities, and sponsored goodies."
        },
        {
          question: "How will winners be selected?",
          answer: "Winners will be chosen based on performance metrics specific to each event. Judging criteria are available on event pages."
        }
      ]
    },
    contact: {
      questions: [
        {
          question: "How can I contact the organizers?",
          answer: "Reach out to us at [email] or through our social media channels."
        },
        {
          question: "What if I have technical issues during the event?",
          answer: "We'll have a dedicated technical support team available throughout the event."
        }
      ]
    }
  };

  const menuItems: MenuItem[] = [
    { id: 'general', label: 'GENERAL', icon: Flag },
    { id: 'events', label: 'EVENTS', icon: Target },
    { id: 'prizes', label: 'PRIZES', icon: Crosshair },
    { id: 'contact', label: 'CONTACT', icon: Briefcase }
  ];

  const [selectedSection, setSelectedSection] = useState<keyof FAQData>('general');
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(questionId)) {
      newOpenQuestions.delete(questionId);
    } else {
      newOpenQuestions.add(questionId);
    }
    setOpenQuestions(newOpenQuestions);
  };

  return (
    <TwinkleBackground gradient="linear-gradient(to bottom, #000000, #030308)">
      <div className="min-h-screen text-white py-20 md:py-40 lg:py-60">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-6xl sm:text-7xl xl:text-8xl font-bold mb-8 tracking-wider font-dystopian text-[#2AD7DB]"
              style={{
                textShadow: "0 0 20px rgba(42,215,219,0.3), 0 0 40px rgba(42,215,219,0.2), 0 0 60px rgba(42,215,219,0.1)"
              }}
            >
              FAQ
            </motion.h1>
          </div>

          <div className="lg:hidden relative mb-8">
            <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6 space-x-4 pb-4">
              {menuItems.map((item, index) => (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={item.id}
                  onClick={() => setSelectedSection(item.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full transition-all duration-300
                    ${selectedSection === item.id 
                      ? 'bg-[#2AD7DB]/10 text-[#2AD7DB] border-[#2AD7DB]' 
                      : 'text-gray-400 hover:text-white border-gray-700'}`}
                >
                  <item.icon className={`w-5 h-5 ${selectedSection === item.id ? 'text-[#2AD7DB]' : 'text-gray-400'}`} />
                  <span className="text-base font-medium">{item.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />
          </div>

          <div className="hidden lg:grid lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
            <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
              <div className="space-y-4">
                {menuItems.map((item, index) => (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={item.id}
                    onClick={() => setSelectedSection(item.id)}
                    className={`w-full text-left py-5 border-b-2 transition-all duration-300 
                      flex items-center gap-4 hover:pl-2
                      ${selectedSection === item.id 
                        ? 'border-[#2AD7DB] text-[#2AD7DB]' 
                        : 'border-gray-700 text-gray-400 hover:text-white'}`}
                  >
                    <item.icon className={`w-6 h-6 ${selectedSection === item.id ? 'text-[#2AD7DB]' : 'text-gray-400'}`} />
                    <span className="text-xl tracking-wider font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {faqData[selectedSection].questions.map((item, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={index}
                      className="border-b border-gray-700/50 rounded-lg bg-black/20 backdrop-blur-sm transition-all duration-300 hover:border-[#2AD7DB]/30 group"
                      style={{
                        boxShadow: openQuestions.has(`${selectedSection}-${index}`) 
                          ? '0 0 20px rgba(42,215,219,0.1)' 
                          : 'none'
                      }}
                    >
                      <button
                        onClick={() => toggleQuestion(`${selectedSection}-${index}`)}
                        className="w-full py-6 px-6 flex justify-between items-center text-left group-hover:text-[#2AD7DB] transition-colors"
                      >
                        <span className="text-xl font-medium pr-8">{item.question}</span>
                        <motion.div
                          animate={{ rotate: openQuestions.has(`${selectedSection}-${index}`) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className={`transition-colors duration-300 ${
                            openQuestions.has(`${selectedSection}-${index}`) 
                              ? 'text-[#2AD7DB]' 
                              : 'group-hover:text-[#2AD7DB]'
                          }`}
                        >
                          <ChevronDown className="w-6 h-6" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {openQuestions.has(`${selectedSection}-${index}`) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pb-6 px-6 text-gray-300 text-lg leading-relaxed">
                              {item.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:hidden px-4 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {faqData[selectedSection].questions.map((item, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={index}
                    className="border-b border-gray-700 rounded-lg bg-black/20 backdrop-blur-sm"
                  >
                    <button
                      onClick={() => toggleQuestion(`${selectedSection}-${index}`)}
                      className="w-full py-6 px-6 flex justify-between items-center text-left hover:text-[#2AD7DB] transition-colors"
                    >
                      <span className="text-xl font-medium pr-8">{item.question}</span>
                      <motion.div
                        animate={{ rotate: openQuestions.has(`${selectedSection}-${index}`) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className={`transition-colors duration-300 ${
                          openQuestions.has(`${selectedSection}-${index}`) 
                            ? 'text-[#2AD7DB]' 
                            : 'group-hover:text-[#2AD7DB]'
                        }`}
                      >
                        <ChevronDown className="w-6 h-6" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openQuestions.has(`${selectedSection}-${index}`) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-6 px-6 text-gray-300 text-lg leading-relaxed">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

        </motion.div>
      </div>
    </TwinkleBackground>
  );
}

