'use client'
import React, { useState } from 'react';
import { ChevronDown, Target, Crosshair, Briefcase, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
          answer: "Zenith is a flagship 36-hour tech contest organized by Point Blank. It brings together 200+ top programmers for CTF, hackathons, competitive programming, and a Kaggle competition."
        },
        {
          question: "When and where is Zenith happening?",
          answer: "The event is scheduled for April 27-28, 2025, with the venue to be announced soon. Please note that the dates are tentative."
        },
        {
          question: "Who can Participate?",
          answer: "Zenith is open to college students, professionals, and tech enthusiasts from across India. Some competitions may have specific eligibility criteria."
        },
        {
          question: "Is there any participation fee?",
          answer: "No, participation in Zenith is completely free."
        },
        {
          question: "What kind of prizes can participants expect?",
          answer: "Prizes include cash rewards, goodies, certificates, and special surprises for the winners."
        },
        {
          question: "What expenses does Zenith cover for participants?",
          answer: "Zenith covers the registration fees for all participants, ensuring a seamless experience for attendees."
        },
        {
          question: "Are travel-related expenses reimbursable for participants?",
          answer: "We will not cover travel expenses for participants."
        }
        
      ]
    },
    events: {
      questions: [
        {
          question: "What are the different contests in Zenith?",
          answer: "Zenith features CTF for cybersecurity challenges, a Hackathon for software and AI innovation, Competitive Programming for algorithmic problem-solving, and a Kaggle Competition for AI/ML-based challenges."
        },
        {
          question: "How do I register?",
          answer: "Registration details will be announced soon on our official website and social media."
        },
        {
          question: "Can I participate individually or in teams?",
          answer: "Registrations will be individual, and teams will be formed on the spot during the event. However, you can view other participants' profiles and connect with them beforehand if you wish to set up your team in advance."
        }
      ]
    },
    accomodation: {
      questions: [
        {
          question: "Will food and accommodation be provided?",
          answer: "Yes, participants will have access to food and rest areas during the 36-hour contest."
        },
        {
          question: "What should I bring to the event?",
          answer: "Bring your laptop, chargers, ID card, and any necessary accessories for coding. Internet access and power outlets will be provided."
        },
        {
          question: "Will there be mentorship or guidance available?",
          answer: "Yes, industry professionals and mentors will be present to guide participants during the event."
        }
      ]
    },
    contact: {
      questions: [
        {
          question: "How can I contact the organizers?",
          answer: "Reach out to us at zenith@pointblank.club or through our social media channels."
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
    { id: 'accomodation', label: 'ACCOMODATION', icon: Crosshair },
    { id: 'contact', label: 'CONTACT', icon: Briefcase }
  ];

  const [selectedSection, setSelectedSection] = useState<keyof FAQData>('general');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const toggleQuestion = (questionId: string) => {
    if (openQuestion === questionId) {
      // If clicking the same question, close it
      setOpenQuestion(null);
    } else {
      // Otherwise open the new question (and automatically close the previous one)
      setOpenQuestion(questionId);
    }
  };

  return (
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
              className="text-[6rem] sm:text-7xl xl:text-8xl text-center sm:text-left font-bold mb-8 tracking-wider font-dystopian text-[#2AD7DB]"
              style={{
              textShadow: "0 0 20px rgba(42,215,219,0.3), 0 0 40px rgba(42,215,219,0.2), 0 0 60px rgba(42,215,219,0.1)"
              }}
            >
              FAQ
            </motion.h1>
            </div>

          <div className="lg:hidden relative mb-8">
            <div 
              className="flex overflow-x-auto px-4 sm:px-6 space-x-4 pb-4"
              style={{
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
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
                        boxShadow: openQuestion === `${selectedSection}-${index}` 
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
                          animate={{ rotate: openQuestion === `${selectedSection}-${index}` ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className={`transition-colors duration-300 ${
                            openQuestion === `${selectedSection}-${index}` 
                              ? 'text-[#2AD7DB]' 
                              : 'group-hover:text-[#2AD7DB]'
                          }`}
                        >
                          <ChevronDown className="w-6 h-6" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {openQuestion === `${selectedSection}-${index}` && (
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
                        animate={{ rotate: openQuestion === `${selectedSection}-${index}` ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className={`transition-colors duration-300 ${
                          openQuestion === `${selectedSection}-${index}` 
                            ? 'text-[#2AD7DB]' 
                            : 'group-hover:text-[#2AD7DB]'
                        }`}
                      >
                        <ChevronDown className="w-6 h-6" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openQuestion === `${selectedSection}-${index}` && (
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
    // </ground>
  );
}

