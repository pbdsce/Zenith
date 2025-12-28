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
  const [userRequests, setUserRequests] = useState<Record<string, string>>({}); // teamCode -> requestStatus
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

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
          if (teamsData.success && teamsData.data && Array.isArray(teamsData.data.teams)) {
            // Transform API response to match component interface
            const transformed = teamsData.data.teams.map((team: any) => ({
              teamName: team.teamName,
              teamCode: team.teamCode,
              problemStatement: team.appliedFor?.title || 'No problem statement selected',
              currentMembers: team.currentMemberCount || 0,
              maxMembers: team.maxMembers || 4,
            }));
            setTeamsLookingForMembers(transformed);
          } else {
            setTeamsLookingForMembers([]);
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
          if (participantsData.success && participantsData.data && Array.isArray(participantsData.data.users)) {
            // Transform API response to match component interface
            const transformed = participantsData.data.users.map((user: any) => ({
              name: user.name,
              skills: user.bio || 'No skills listed',
              interests: user.bio || 'No interests listed',
              university: user.organisation || undefined,
            }));
            setParticipantsLookingForTeams(transformed);
          } else {
            setParticipantsLookingForTeams([]);
          }
        }

        // Fetch user's join requests
        const requestsResponse = await fetch(`${API_ENDPOINTS.joinRequest}?type=user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          if (requestsData.success && requestsData.data && Array.isArray(requestsData.data.requests)) {
            const requestsMap: Record<string, string> = {};
            requestsData.data.requests.forEach((req: any) => {
              // Only track pending and accepted requests
              // Declined/cancelled requests are ignored so user can send a new request
              if (req.status === 'pending' || req.status === 'accepted') {
                requestsMap[req.teamCode] = req.status;
              }
            });
            setUserRequests(requestsMap);
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

  const handleSendRequest = async (teamCode: string) => {
    if (!user) return;

    try {
      setSendingRequest(teamCode);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.joinRequest, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send request');
      }

      // Update user requests map
      setUserRequests(prev => ({ ...prev, [teamCode]: 'pending' }));
    } catch (error) {
      console.error('Error sending join request:', error);
      alert(error instanceof Error ? error.message : 'Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  return (
    <div className="flex flex-col gap-[24px] w-full">
      <FormSection title="Teams Looking for Members">
        {isLoading ? (
          <div className="text-white text-center py-[40px]">Loading teams...</div>
        ) : Array.isArray(teamsLookingForMembers) && teamsLookingForMembers.length === 0 ? (
          <div className="text-white text-center py-[40px] opacity-70">
            No teams are currently looking for members.
          </div>
        ) : Array.isArray(teamsLookingForMembers) && teamsLookingForMembers.length > 0 ? (
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
                  {userRequests[team.teamCode] === 'pending' ? (
                    <Button 
                      variant="secondary"
                      disabled
                    >
                      <Users className="w-4 h-4" />
                      Request Sent
                    </Button>
                  ) : userRequests[team.teamCode] === 'accepted' ? (
                    <Button 
                      variant="secondary"
                      disabled
                    >
                      <Users className="w-4 h-4" />
                      Accepted
                    </Button>
                  ) : userRequests[team.teamCode] === 'declined' ? (
                    <Button 
                      variant="secondary"
                      onClick={() => handleSendRequest(team.teamCode)}
                      disabled={sendingRequest === team.teamCode}
                    >
                      <Users className="w-4 h-4" />
                      {sendingRequest === team.teamCode ? 'Sending...' : 'Send Request'}
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary"
                      onClick={() => handleSendRequest(team.teamCode)}
                      disabled={sendingRequest === team.teamCode}
                    >
                      <Users className="w-4 h-4" />
                      {sendingRequest === team.teamCode ? 'Sending...' : 'Send Request'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-white text-center py-[40px] opacity-70">
            No teams are currently looking for members.
          </div>
        )}
      </FormSection>

      <FormSection title="Participants Looking for Teams">
        {isLoading ? (
          <div className="text-white text-center py-[40px]">Loading participants...</div>
        ) : Array.isArray(participantsLookingForTeams) && participantsLookingForTeams.length === 0 ? (
          <div className="text-white text-center py-[40px] opacity-70">
            No participants are currently looking for teams.
          </div>
        ) : Array.isArray(participantsLookingForTeams) && participantsLookingForTeams.length > 0 ? (
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
        ) : (
          <div className="text-white text-center py-[40px] opacity-70">
            No participants are currently looking for teams.
          </div>
        )}
      </FormSection>
    </div>
  );
}

