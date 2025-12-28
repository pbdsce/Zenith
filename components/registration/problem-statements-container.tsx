"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Eye, UserPlus } from "lucide-react";
import { FormSection } from "./form-section";
import { Button } from "./button";
import { Card } from "./card";

interface ProblemStatement {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  active: boolean;
}

interface ProblemStatementsContainerProps {
  onNavigate: (view: string) => void;
}

export function ProblemStatementsContainer({ onNavigate }: ProblemStatementsContainerProps) {
  const { isAuthenticated, getToken } = useAuth();
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProblemStatements = async () => {
      try {
        const token = await getToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(API_ENDPOINTS.problemStatements, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setProblemStatements(data.data);
          }
        } else {
          // Fallback to mock data if API fails
          setProblemStatements([
            { id: '1', title: 'AI-Powered Healthcare Assistant', description: 'Build an AI solution for healthcare diagnostics', category: 'AI/ML', difficulty: 'Advanced', active: true },
            { id: '2', title: 'Sustainable Smart City Platform', description: 'Create a platform for managing smart city infrastructure', category: 'IoT', difficulty: 'Intermediate', active: true },
            { id: '3', title: 'Financial Inclusion App', description: 'Develop a mobile app for underbanked populations', category: 'FinTech', difficulty: 'Beginner', active: true },
            { id: '4', title: 'Blockchain Supply Chain', description: 'Build a transparent supply chain solution using blockchain', category: 'Blockchain', difficulty: 'Advanced', active: true },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch problem statements:', error);
        // Fallback to mock data
        setProblemStatements([
          { id: '1', title: 'AI-Powered Healthcare Assistant', description: 'Build an AI solution for healthcare diagnostics', category: 'AI/ML', difficulty: 'Advanced', active: true },
          { id: '2', title: 'Sustainable Smart City Platform', description: 'Create a platform for managing smart city infrastructure', category: 'IoT', difficulty: 'Intermediate', active: true },
          { id: '3', title: 'Financial Inclusion App', description: 'Develop a mobile app for underbanked populations', category: 'FinTech', difficulty: 'Beginner', active: true },
          { id: '4', title: 'Blockchain Supply Chain', description: 'Build a transparent supply chain solution using blockchain', category: 'Blockchain', difficulty: 'Advanced', active: true },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblemStatements();
  }, [getToken]);

  return (
    <div className="flex flex-col gap-[32px] max-w-[900px] w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-['Instrument_Serif',sans-serif] text-[42px] text-white">
          Problem Statements
        </h1>
        {!isAuthenticated && (
          <Button onClick={() => onNavigate('register')} variant="primary">
            <UserPlus className="w-4 h-4" />
            Register to Participate
          </Button>
        )}
      </div>

      <FormSection title="All Challenges">
        {isLoading ? (
          <div className="text-white text-center py-[40px]">Loading challenges...</div>
        ) : (
          <div className="flex flex-col gap-[16px]">
            {problemStatements.map((ps) => (
              <Card key={ps.id}>
                <div className="flex flex-col gap-[12px]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-['Inter',sans-serif] text-[18px] text-white mb-[8px]">{ps.title}</h3>
                      <p className="font-['Inter',sans-serif] text-[14px] text-white opacity-70 mb-[12px]">
                        {ps.description}
                      </p>
                      <div className="flex items-center gap-[12px]">
                        <span className="text-[13px] text-[#ff4d00] bg-[rgba(255,77,0,0.2)] px-[10px] py-[4px] rounded-[8px]">
                          {ps.category}
                        </span>
                        <span className="text-[13px] text-white opacity-60">
                          {ps.difficulty}
                        </span>
                      </div>
                    </div>
                    <Button variant="secondary">
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}

