"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Users, Search } from "lucide-react";
import { FormSection } from "./form-section";
import { Button } from "./button";
import { Card } from "./card";

interface DiscoverContainerProps {
  onNavigate: (view: string) => void;
}

interface TeamLookingForMembers {
  teamName: string;
  teamCode: string;
  problemStatement: string;
  currentMembers: number;
  maxMembers: number;
}

interface ParticipantLookingForTeam {
  name: string;
  skills: string;
  interests: string;
  university?: string;
}

export function DiscoverContainer({ onNavigate }: DiscoverContainerProps) {
  const { user, getToken } = useAuth();
  const [teamsLookingForMembers, setTeamsLookingForMembers] = useState<TeamLookingForMembers[]>([]);
  const [participantsLookingForTeams, setParticipantsLookingForTeams] = useState<ParticipantLookingForTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Fetch teams looking for members
        const teamsResponse = await fetch(API_ENDPOINTS.lookingForMembers, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          if (teamsData.success && teamsData.data) {
            setTeamsLookingForMembers(teamsData.data);
          }
        }

        // Fetch participants looking for teams
        const participantsResponse = await fetch(API_ENDPOINTS.lookingForTeam, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          if (participantsData.success && participantsData.data) {
            setParticipantsLookingForTeams(participantsData.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch discover data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  const handleJoinTeam = (teamCode: string) => {
    // Navigate to team section with pre-filled join code
    onNavigate(`team?joinCode=${teamCode}`);
  };

  return (
    <div className="flex flex-col gap-[24px] w-full">
      <FormSection title="Teams Looking for Members">
        {isLoading ? (
          <div className="text-white text-center py-[40px]">Loading teams...</div>
        ) : teamsLookingForMembers.length === 0 ? (
          <div className="text-white text-center py-[40px] opacity-70">
            No teams are currently looking for members.
          </div>
        ) : (
          <div className="flex flex-col gap-[16px]">
            {teamsLookingForMembers.map((team, idx) => (
              <Card key={idx}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-['Inter',sans-serif] text-[16px] text-white mb-[4px]">{team.teamName}</h3>
                    <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-70 mb-[8px]">
                      Problem: {team.problemStatement}
                    </p>
                    <div className="flex items-center gap-[12px]">
                      <span className="font-['Inter',sans-serif] text-[12px] text-white opacity-60">
                        {team.currentMembers}/{team.maxMembers} members
                      </span>
                      <span className="font-['Inter',sans-serif] text-[12px] text-white opacity-60">
                        Code: <span className="font-mono text-[#ff4d00]">{team.teamCode}</span>
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="secondary"
                    onClick={() => handleJoinTeam(team.teamCode)}
                  >
                    <Users className="w-4 h-4" />
                    Join
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title="Participants Looking for Teams">
        {isLoading ? (
          <div className="text-white text-center py-[40px]">Loading participants...</div>
        ) : participantsLookingForTeams.length === 0 ? (
          <div className="text-white text-center py-[40px] opacity-70">
            No participants are currently looking for teams.
          </div>
        ) : (
          <div className="flex flex-col gap-[16px]">
            {participantsLookingForTeams.map((participant, idx) => (
              <Card key={idx}>
                <div className="flex flex-col gap-[8px]">
                  <div className="flex items-start justify-between">
                    <h3 className="font-['Inter',sans-serif] text-[16px] text-white">{participant.name}</h3>
                    {participant.university && (
                      <span className="font-['Inter',sans-serif] text-[12px] text-white opacity-60">{participant.university}</span>
                    )}
                  </div>
                  <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-70">
                    Skills: {participant.skills}
                  </p>
                  <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-70">
                    Interests: {participant.interests}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}

