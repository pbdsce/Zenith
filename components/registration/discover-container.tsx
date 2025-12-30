"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Users, Search, Home } from "lucide-react";
import { FormSection } from "./form-section";
import { Button } from "./button";
import { Card } from "./card";
import { SectionTab } from "./section-tab";
import { TeamDetailsModal, TeamDetails } from "./team-details-modal";
import { UserProfileModal, UserDetails } from "./user-profile-modal";
import { useToast } from "@/hooks/use-toast";


interface TeamLookingForMembers {
  teamName: string;
  teamCode: string;
  problemStatement: string;
  currentMembers: number;
  maxMembers: number;
  teamLead?: {
    id: string;
    name: string;
  };
  teamMembers?: Array<{
    id: string;
    name: string;
    organisation?: string;
  }>;
  appliedFor?: {
    id: string;
    title: string;
  };
}

interface ParticipantLookingForTeam {
  id: string; // uid
  name: string;
  skills: string;
  interests: string;
  university?: string;
  email?: string;
}

export function DiscoverContainer() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"teams" | "participants">("teams");
  const [teamsLookingForMembers, setTeamsLookingForMembers] = useState<TeamLookingForMembers[]>([]);
  const [participantsLookingForTeams, setParticipantsLookingForTeams] = useState<ParticipantLookingForTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRequests, setUserRequests] = useState<Record<string, string>>({}); // teamCode -> requestStatus
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [invitingUser, setInvitingUser] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set()); // User IDs
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Modal states
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Build query string
        const queryParams = debouncedSearchQuery.trim()
          ? `?search=${encodeURIComponent(debouncedSearchQuery.trim())}`
          : '';

        // Check if user is Team Lead
        if (user?.teamCode) {
          try {
            const teamResponse = await fetch(API_ENDPOINTS.getTeam(user.teamCode), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            });
            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              if (teamData.success && teamData.data) {
                const leadId = typeof teamData.data.teamLead === 'string' ? teamData.data.teamLead : teamData.data.teamLead?.id;
                if (leadId === user.uid) {
                  setIsTeamLead(true);
                  setActiveTab("participants"); // Auto-switch for team leads

                  // Fetch already sent invites by this team
                  try {
                    const invitesResponse = await fetch(`${API_ENDPOINTS.joinRequest}?teamCode=${user.teamCode}`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      }
                    });
                    if (invitesResponse.ok) {
                      const invitesData = await invitesResponse.json();
                      if (invitesData.success && invitesData.data && Array.isArray(invitesData.data.requests)) {
                        const inviteeIds = new Set<string>();
                        invitesData.data.requests.forEach((req: any) => {
                          if (req.type === 'invite' && (req.status === 'pending' || req.status === 'accepted')) {
                            inviteeIds.add(req.userId);
                          }
                        });
                        setSentInvites(inviteeIds);
                      }
                    }
                  } catch (e) {
                    console.error("Error fetching sent invites:", e);
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error verifying team lead status:", error);
          }
        }

        // Fetch teams looking for members
        const teamsResponse = await fetch(`${API_ENDPOINTS.lookingForMembers}${queryParams}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          if (teamsData.success && teamsData.data && Array.isArray(teamsData.data.teams)) {
            // Transform API response to match component interface - store all available data
            const transformed = teamsData.data.teams.map((team: any) => ({
              teamName: team.teamName,
              teamCode: team.teamCode,
              problemStatement: team.appliedFor?.title || 'No problem statement selected',
              currentMembers: team.currentMemberCount || 0,
              maxMembers: team.maxMembers || 4,
              teamLead: team.teamLead,
              teamMembers: team.teamMembers,
              appliedFor: team.appliedFor,
            }));
            setTeamsLookingForMembers(transformed);
          } else {
            setTeamsLookingForMembers([]);
          }
        }

        // Fetch participants looking for teams
        const participantsResponse = await fetch(`${API_ENDPOINTS.lookingForTeam}${queryParams}`, {
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
              id: user.id, // Store uid for fetching details
              name: user.name,
              skills: user.bio || 'No skills listed',
              interests: user.bio || 'No interests listed',
              university: user.organisation || undefined,
              email: user.email,
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
  }, [getToken, user, debouncedSearchQuery]);

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
      toast({
        title: "Request sent",
        description: "Your join request has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        variant: "destructive",
        title: "Failed to send request",
        description: error instanceof Error ? error.message : 'Failed to send request',
      });
    } finally {
      setSendingRequest(null);
    }
  };

  const handleInviteUser = async (userEmail: string, userId: string) => {
    if (!user || !user.teamCode) return;

    try {
      setInvitingUser(userId);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.joinRequest, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamCode: user.teamCode,
          type: 'invite',
          email: userEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to invite user');
      }

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${userEmail} successfully.`,
      });

      setSentInvites(prev => new Set(prev).add(userId));

    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        variant: "destructive",
        title: "Failed to send invite",
        description: error instanceof Error ? error.message : 'Failed to send invite',
      });
    } finally {
      setInvitingUser(null);
    }
  };

  const handleTeamClick = async (teamCode: string) => {
    setSelectedTeamCode(teamCode);
    setIsLoadingTeam(true);
    setTeamError(null);
    
    // First, try to use the basic data we already have from the looking-for-members endpoint
    const basicTeamData = teamsLookingForMembers.find(t => t.teamCode === teamCode);
    
    // Try to fetch full team details (will fail if user is not a member)
    try {
      const token = await getToken();
      if (!token) {
        // If no token, use basic data
        if (basicTeamData) {
          const basicDetails = {
            teamCode: basicTeamData.teamCode,
            teamName: basicTeamData.teamName,
            teamLead: basicTeamData.teamLead || { id: '', name: 'Unknown' },
            teamMembers: basicTeamData.teamMembers?.map(m => ({
              uid: m.id,
              name: m.name,
              role: 'Member',
            })) || [],
            appliedFor: basicTeamData.appliedFor,
            memberCount: basicTeamData.currentMembers,
            maxMembers: basicTeamData.maxMembers,
            teamStatus: 'pending',
          };
          setTeamDetails(basicDetails);
        } else {
          setTeamError('Authentication required');
        }
        setIsLoadingTeam(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.getTeam(teamCode), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTeamDetails(data.data);
          setTeamError(null);
        } else {
          // Fallback to basic data
          if (basicTeamData) {
            const basicDetails = {
              teamCode: basicTeamData.teamCode,
              teamName: basicTeamData.teamName,
              teamLead: basicTeamData.teamLead || { id: '', name: 'Unknown' },
              teamMembers: basicTeamData.teamMembers?.map(m => ({
                uid: m.id,
                name: m.name,
                role: 'Member',
              })) || [],
              appliedFor: basicTeamData.appliedFor,
              memberCount: basicTeamData.currentMembers,
              maxMembers: basicTeamData.maxMembers,
              teamStatus: 'pending',
            };
            setTeamDetails(basicDetails);
          } else {
            setTeamError('Failed to load team details');
          }
        }
      } else {
        // If API fails (e.g., user is not a member), use basic data if available
        if (basicTeamData) {
          const basicDetails = {
            teamCode: basicTeamData.teamCode,
            teamName: basicTeamData.teamName,
            teamLead: basicTeamData.teamLead || { id: '', name: 'Unknown' },
            teamMembers: basicTeamData.teamMembers?.map(m => ({
              uid: m.id,
              name: m.name,
              role: 'Member',
            })) || [],
            appliedFor: basicTeamData.appliedFor,
            memberCount: basicTeamData.currentMembers,
            maxMembers: basicTeamData.maxMembers,
            teamStatus: 'pending',
          };
          setTeamDetails(basicDetails);
          setTeamError(null);
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || 'Failed to fetch team details';
          setTeamError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      // Fallback to basic data if available
      if (basicTeamData) {
        const basicDetails: TeamDetails = {
          teamCode: basicTeamData.teamCode,
          teamName: basicTeamData.teamName,
          teamLead: basicTeamData.teamLead || { id: '', name: 'Unknown' },
          teamMembers: basicTeamData.teamMembers?.map(m => ({
            uid: m.id,
            name: m.name,
            role: 'Member',
          })) || [],
          appliedFor: basicTeamData.appliedFor,
          memberCount: basicTeamData.currentMembers,
          maxMembers: basicTeamData.maxMembers,
          teamStatus: 'pending',
        };
        setTeamDetails(basicDetails);
      } else {
        setTeamError('Network error. Please try again.');
      }
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleCloseTeamModal = () => {
    setSelectedTeamCode(null);
    setTeamDetails(null);
    setTeamError(null);
    // Also close user modal if open
    setSelectedUserId(null);
    setUserDetails(null);
  };

  const handleUserClick = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingUser(true);
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.user) {
          setUserDetails(data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleCloseUserModal = () => {
    setSelectedUserId(null);
    setUserDetails(null);
  };



  return (
    <div className="flex flex-col gap-[24px] w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-[42px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Discover
        </h1>
        <Button onClick={() => router.push("/dashboard")} variant="secondary">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      {user?.teamCode && !isTeamLead ? (
        <div className="flex flex-col items-center justify-center py-[60px] text-center">
          <div className="bg-[rgba(255,165,0,0.1)] border border-orange-500/30 rounded-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">You are already in a team!</h2>
            <p className="text-gray-300 mb-6">
              You are currently a member of team <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">{user.teamCode}</span>.
              <br />
              Please leave your current team if you wish to join another one.
            </p>
            <Button onClick={() => router.push("/dashboard")} variant="primary">
              Go to Team Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <>
          <FormSection title={isTeamLead ? "Find Team Members" : "What are you looking for?"}>
            <div className="flex flex-col gap-[24px]">
              {/* Tab Navigation */}
              <div className="flex gap-[12px]">
                {/* Only user without team can see teams tab */}
                {!isTeamLead && (
                  <SectionTab
                    active={activeTab === "teams"}
                    onClick={() => setActiveTab("teams")}
                    icon={Users}
                    label="Teams"
                  />
                )}
                <SectionTab
                  active={activeTab === "participants"}
                  onClick={() => setActiveTab("participants")}
                  icon={Search}
                  label="Participants"
                />
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white opacity-60" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "teams" ? "teams" : "participants"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[rgba(138,138,138,0.1)] border border-[rgba(255,255,255,0.2)] rounded-[12px] text-white placeholder-white/60 focus:outline-none focus:border-[#ff4d00] transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>

              {/* Tab Content */}
              {activeTab === "teams" && !isTeamLead ? (
                <div>
                  {isLoading ? (
                    <div className="text-white text-center py-[40px]">Loading teams...</div>
                  ) : teamsLookingForMembers.length === 0 ? (
                    <div className="text-white text-center py-[40px] opacity-70">
                      {searchQuery.trim() ? "No teams match your search." : "No teams are currently looking for members."}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[16px]">
                      {teamsLookingForMembers.map((team, idx) => (
                        <div
                          key={idx}
                          className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[rgba(255,77,0,0.2)]"
                        >
                          <Card>
                            <div
                              className="flex items-start justify-between cursor-pointer"
                              onClick={() => handleTeamClick(team.teamCode)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-[12px] mb-[8px]">
                                  <h3 className="font-['Inter',sans-serif] text-[16px] text-white">{team.teamName}</h3>
                                  {userRequests[team.teamCode] === 'pending' && (
                                    <span className="px-[8px] py-[2px] bg-[rgba(255,235,59,0.2)] border border-[#ffeb3b] rounded-[6px] text-[12px] text-[#ffeb3b] font-medium">
                                      Request Sent
                                    </span>
                                  )}
                                  {userRequests[team.teamCode] === 'accepted' && (
                                    <span className="px-[8px] py-[2px] bg-[rgba(76,175,80,0.2)] border border-[#4caf50] rounded-[6px] text-[12px] text-[#4caf50] font-medium">
                                      Accepted
                                    </span>
                                  )}
                                </div>
                                <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-70 mb-[8px]">
                                  Problem: {team.problemStatement}
                                </p>
                                <div className="flex items-center gap-[12px]">
                                  <span className="font-['Inter',sans-serif] text-[12px] text-white opacity-60">
                                    {team.currentMembers}/{team.maxMembers} members
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {isLoading ? (
                    <div className="text-white text-center py-[40px]">Loading participants...</div>
                  ) : participantsLookingForTeams.length === 0 ? (
                    <div className="text-white text-center py-[40px] opacity-70">
                      {searchQuery.trim() ? "No participants match your search." : "No participants are currently looking for teams."}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[16px]">
                      {participantsLookingForTeams.map((participant, idx) => (
                        <div
                          key={idx}
                          className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[rgba(255,77,0,0.2)]"
                        >
                          <Card>
                            <div className="flex items-start justify-between">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => handleUserClick(participant.id)}
                              >
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
                              </div>

                              {/* Invite Button for Team Leads */}
                              {isTeamLead && participant.email && (
                                <div className="ml-[16px] flex items-center">
                                  <Button
                                    variant="primary"
                                    onClick={() => handleInviteUser(participant.email!, participant.id)}
                                    disabled={invitingUser === participant.id || sentInvites.has(participant.id)}
                                  >
                                    {sentInvites.has(participant.id) ? "Invited" : invitingUser === participant.id ? "Sending..." : "Invite"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormSection>

          {/* Team Details Modal */}
          <TeamDetailsModal
            isOpen={!!selectedTeamCode}
            onClose={handleCloseTeamModal}
            teamDetails={teamDetails}
            isLoading={isLoadingTeam}
            error={teamError}
            onMemberClick={(userId: string) => handleUserClick(userId)}
            requestStatus={selectedTeamCode ? userRequests[selectedTeamCode] : undefined}
            onSendRequest={selectedTeamCode ? () => handleSendRequest(selectedTeamCode) : undefined}
            isSendingRequest={selectedTeamCode ? sendingRequest === selectedTeamCode : false}
          />

          {/* User Details Modal */}
          <UserProfileModal
            isOpen={!!selectedUserId}
            onClose={handleCloseUserModal}
            userDetails={userDetails}
            isLoading={isLoadingUser}
          />
        </>
      )}
    </div>
  );
}

