"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Home, Users, Upload, X, Award, Check, UserPlus, Trash2, User, ExternalLink } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { FormSelect } from "./form-select";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
import { AlertBanner } from "./alert-banner";
import { UserProfileModal, UserDetails } from "./user-profile-modal";
import { Modal } from "./modal";

interface TeamMember {
  uid: string;
  name: string;
  email?: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  code: string;
  leadId: string;
  members: string[];
  teamMembers?: TeamMember[];
  problemStatement: string;
  lookingForMembers: boolean;
  status: "none" | "in-team" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined" | "withdrawn";
}

interface ProblemStatement {
  id: string;
  title: string;
  description?: string;
}

export function TeamContainer() {
  const { user, isAuthenticated, getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState({
    teamName: "",
    problemStatement: "",
    lookingForMembers: false,
    joinCode: "",
  });

  // Read joinCode from URL query params
  useEffect(() => {
    const joinCodeFromUrl = searchParams.get('joinCode');
    if (joinCodeFromUrl) {
      setTeamFormData(prev => ({ ...prev, joinCode: joinCodeFromUrl.toUpperCase() }));
    }
  }, [searchParams]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  
  // User details modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  
  // Problem statement modal state
  const [selectedProblemStatement, setSelectedProblemStatement] = useState<ProblemStatement | null>(null);

  useEffect(() => {
    // Fetch problem statements
    const fetchProblemStatements = async () => {
      try {
        const response = await fetch('/api/problem-statements');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.problemStatements) {
            setProblemStatements(data.data.problemStatements);
          }
        }
      } catch (error) {
        console.error("Error fetching problem statements:", error);
      }
    };
    fetchProblemStatements();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const fetchTeamData = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        const userResponse = await fetch(API_ENDPOINTS.userProfile, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Check for teamCode in the fresh profile data
          const teamCode = userData.success ? userData.data.teamCode : userData.teamCode;

          if (teamCode) {
            const teamResponse = await fetch(API_ENDPOINTS.getTeam(teamCode), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              if (teamData.success && teamData.data) {
                const teamInfo = teamData.data;
                setTeam({
                  id: teamInfo.teamCode,
                  name: teamInfo.teamName,
                  code: teamInfo.teamCode,
                  leadId: typeof teamInfo.teamLead === 'string' ? teamInfo.teamLead : teamInfo.teamLead?.id || '',
                  members: teamInfo.teamMembers?.map((m: any) => m.uid || m.id) || [],
                  teamMembers: teamInfo.teamMembers?.map((m: any) => ({
                    uid: m.uid,
                    name: m.name,
                    email: m.email,
                    role: m.role || 'Member',
                  })) || [],
                  problemStatement: teamInfo.appliedFor?.title || 'No problem statement selected',
                  lookingForMembers: teamInfo.isLooking || false,
                  status: teamInfo.teamStatus === 'pending' ? 'in-team' :
                    teamInfo.teamStatus === 'submitted' ? 'submitted' :
                      teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                        teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                          teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                            teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'in-team',
                });

                // Join requests will be fetched by useEffect when team state is set
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [user, isAuthenticated, router, getToken]);

  // Fetch join requests function
  const fetchJoinRequests = useCallback(async (teamCode: string, token: string) => {
    try {
      setIsLoadingRequests(true);
      const response = await fetch(`${API_ENDPOINTS.joinRequest}?teamCode=${teamCode}&type=team`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setJoinRequests(data.data.requests || []);
        } else {
          setJoinRequests([]);
        }
      } else {
        setJoinRequests([]);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
      setJoinRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  const handleDeleteTeam = async () => {
    if (!team || !user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the team "${team.name}"? This action cannot be undone. All team members will be removed from the team.`
    );

    if (!confirmed) return;

    try {
      const token = await getToken();
      if (!token) {
        setAlert({
          type: "error",
          message: "Authentication required",
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.deleteTeam, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamCode: team.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete team');
      }

      setAlert({
        type: "success",
        message: "Team deleted successfully",
      });

      // Clear team state and redirect to dashboard
      setTeam(null);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error('Error deleting team:', error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete team",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!team || !user) return;
    
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setAlert({
          type: "error",
          message: "Authentication required",
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.removeMember, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamCode: team.code,
          memberId,
          setTheirLookingStatus: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove member');
      }

      setAlert({
        type: "success",
        message: `${memberName} has been removed from the team`,
      });
      setTimeout(() => setAlert(null), 3000);

      // Refresh team data
      const teamResponse = await fetch(API_ENDPOINTS.getTeam(team.code), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        if (teamData.success && teamData.data) {
          const teamInfo = teamData.data;
          setTeam({
            id: teamInfo.teamCode,
            name: teamInfo.teamName,
            code: teamInfo.teamCode,
            leadId: typeof teamInfo.teamLead === 'string' ? teamInfo.teamLead : teamInfo.teamLead?.id || '',
            members: teamInfo.teamMembers?.map((m: any) => m.uid || m.id) || [],
            teamMembers: teamInfo.teamMembers?.map((m: any) => ({
              uid: m.uid,
              name: m.name,
              email: m.email,
              role: m.role || 'Member',
            })) || [],
            problemStatement: teamInfo.appliedFor?.title || 'No problem statement selected',
            lookingForMembers: teamInfo.isLooking || false,
            status: teamInfo.teamStatus === 'pending' ? 'in-team' :
              teamInfo.teamStatus === 'submitted' ? 'submitted' :
                teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                  teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                    teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                      teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'in-team',
          });
        }
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to remove member",
      });
      setTimeout(() => setAlert(null), 3000);
    }
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

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    if (!team) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.respondToJoinRequest(requestId), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} request`);
      }

      setAlert({
        type: action === 'accept' ? 'success' : 'info',
        message: data.message || `Request ${action}ed successfully`,
      });
      setTimeout(() => setAlert(null), 3000);

      // Refresh team data and requests
      if (team.code) {
        const teamResponse = await fetch(API_ENDPOINTS.getTeam(team.code), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          if (teamData.success && teamData.data) {
            const teamInfo = teamData.data;
            setTeam({
              id: teamInfo.teamCode,
              name: teamInfo.teamName,
              code: teamInfo.teamCode,
              leadId: typeof teamInfo.teamLead === 'string' ? teamInfo.teamLead : teamInfo.teamLead?.id || '',
              members: teamInfo.teamMembers?.map((m: any) => m.uid || m.id) || [],
              teamMembers: teamInfo.teamMembers?.map((m: any) => ({
                uid: m.uid,
                name: m.name,
                email: m.email,
                role: m.role || 'Member',
              })) || [],
              problemStatement: teamInfo.appliedFor?.title || 'No problem statement selected',
              lookingForMembers: teamInfo.isLooking || false,
              status: teamInfo.teamStatus === 'pending' ? 'in-team' :
                teamInfo.teamStatus === 'submitted' ? 'submitted' :
                  teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                    teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                      teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                        teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'in-team',
            });
          }
        }
        
        // Refresh join requests
        await fetchJoinRequests(team.code, token);
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : `Failed to ${action} request`,
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      const token = await getToken();

      // Call API to create team
      // Build payload
      const selectedProblem = problemStatements.find(ps => ps.title === teamFormData.problemStatement);

      const payload = {
        teamName: teamFormData.teamName,
        appliedFor: selectedProblem ? selectedProblem.id : undefined,
        isLooking: teamFormData.lookingForMembers
      };

      const response = await fetch(API_ENDPOINTS.createTeam, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create team');
      }

      if (data.success && data.data) {
        setTeam(data.data);
        setAlert({
          type: "success",
          message: `Team "${data.data.teamName}" created! Team code: ${data.data.teamCode}`,
        });
        setTimeout(() => setAlert(null), 5000);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create team",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      const token = await getToken();

      // Call API to join team
      const response = await fetch(API_ENDPOINTS.joinTeam, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamCode: teamFormData.joinCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join team');
      }

      if (data.success && data.data) {
        const teamInfo = data.data;
        setTeam({
          id: teamInfo.teamCode,
          name: teamInfo.teamName,
          code: teamInfo.teamCode,
          leadId: typeof teamInfo.teamLead === 'string' ? teamInfo.teamLead : teamInfo.teamLead?.id || '',
          members: teamInfo.teamMembers?.map((m: any) => m.uid || m.id) || [],
          problemStatement: teamInfo.appliedFor?.title || 'No problem statement selected',
          lookingForMembers: teamInfo.isLooking || false,
          status: teamInfo.teamStatus === 'pending' ? 'in-team' :
            teamInfo.teamStatus === 'submitted' ? 'submitted' :
              teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                  teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                    teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'in-team',
        });
        setAlert({
          type: "success",
          message: `Joined team "${teamInfo.teamName}"!`,
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to join team",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch join requests when team changes and user is team lead
  useEffect(() => {
    const loadJoinRequests = async () => {
      if (team && team.leadId === user?.uid && team.code) {
        const token = await getToken();
        if (token) {
          await fetchJoinRequests(team.code, token);
        }
      } else {
        setJoinRequests([]);
        setIsLoadingRequests(false);
      }
    };
    
    loadJoinRequests();
  }, [team?.code, team?.leadId, user?.uid, getToken, fetchJoinRequests]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white" style={{ fontFamily: 'var(--font-body)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[24px] max-w-[700px] w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-[42px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Team Management
        </h1>
        <Button onClick={() => router.push("/dashboard")} variant="secondary">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      {!team ? (
        <>
          <FormSection title="Create a Team">
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-[20px]">
              <FormInput
                label="Team Name"
                placeholder="Enter a creative team name"
                required
                value={teamFormData.teamName}
                onChange={(e) => setTeamFormData({ ...teamFormData, teamName: e.target.value })}
              />
              <div className="flex flex-col gap-[12px]">
                <label className="text-[14px] text-white opacity-90" style={{ fontFamily: 'var(--font-body)' }}>
                  Select a Problem Statement <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-[16px] relative">
                  {problemStatements.map((ps, index) => {
                    const isSelected = teamFormData.problemStatement === ps.title;
                    return (
                      <div
                        key={ps.id}
                        className={`
                          relative p-[16px] rounded-[12px] border-2
                          ${isSelected 
                            ? 'border-[#ff4d00] bg-[rgba(255,77,0,0.15)] shadow-[0_0_20px_rgba(255,77,0,0.3)]' 
                            : 'border-[rgba(255,255,255,0.2)] bg-[rgba(138,138,138,0.1)] hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(138,138,138,0.15)]'
                          }
                          ${isSelected ? 'animate-selectSlide' : 'transition-all duration-300'}
                        `}
                      >
                        <div
                          onClick={() => setTeamFormData({ ...teamFormData, problemStatement: ps.title })}
                          className="cursor-pointer"
                        >
                          <h3 className="text-[16px] font-semibold text-white mb-[8px]" style={{ fontFamily: 'var(--font-body)' }}>
                            {ps.title}
                          </h3>
                          <p className="text-[13px] text-white opacity-70 line-clamp-3 mb-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                            {ps.description || "description goes here"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedProblemStatement(ps);
                          }}
                          className="w-full mt-[8px] flex items-center justify-center gap-[6px] px-[12px] py-[6px] bg-[rgba(255,77,0,0.2)] hover:bg-[rgba(255,77,0,0.3)] border border-[rgba(255,77,0,0.4)] rounded-[8px] text-[13px] text-white transition-colors"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          <span>Read More</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-[8px] p-[16px] rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(138,138,138,0.05)]">
                <div 
                  onClick={() => setTeamFormData({ ...teamFormData, lookingForMembers: !teamFormData.lookingForMembers })}
                  className="flex items-center gap-[12px] cursor-pointer"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="lookingForMembers"
                      checked={teamFormData.lookingForMembers}
                      onChange={(e) => setTeamFormData({ ...teamFormData, lookingForMembers: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300
                      ${teamFormData.lookingForMembers 
                        ? 'border-[#ff4d00] bg-[rgba(255,77,0,0.15)]' 
                        : 'border-[rgba(255,255,255,0.38)] bg-[rgba(138,138,138,0.2)] hover:border-[rgba(255,255,255,0.5)]'
                      }
                    `}>
                      {teamFormData.lookingForMembers && (
                        <Check className="w-3 h-3 text-[#ff4d00] animate-selectSlide" />
                      )}
                    </div>
                  </div>
                  <label htmlFor="lookingForMembers" className="text-[14px] font-semibold text-white cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
                    Looking for team members
                  </label>
                </div>
                <p className="text-[13px] text-white opacity-70 ml-[32px]" style={{ fontFamily: 'var(--font-body)' }}>
                  Enable this to let others know your team is open to new members. Your team will appear in the "Discover" section for participants looking for teams.
                </p>
              </div>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                <Users className="w-4 h-4" />
                Create Team
              </Button>
            </form>
          </FormSection>

          <div className="flex items-center gap-[16px]">
            <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.2)]" />
            <span className="text-[14px] text-white opacity-60" style={{ fontFamily: 'var(--font-body)' }}>
              OR
            </span>
            <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.2)]" />
          </div>

          <FormSection title="Join a Team">
            <form onSubmit={handleJoinTeam} className="flex flex-col gap-[20px]">
              <FormInput
                label="Team Code"
                placeholder="Enter 6-digit team code"
                required
                value={teamFormData.joinCode}
                onChange={(e) => setTeamFormData({ ...teamFormData, joinCode: e.target.value.toUpperCase() })}
              />
              <p className="text-[13px] text-[rgba(255,255,255,0.6)]" style={{ fontFamily: 'var(--font-body)' }}>
                Ask your team leader for the team code to join their team.
              </p>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Join Team
              </Button>
            </form>
          </FormSection>
        </>
      ) : (
        <>
          <FormSection
            title="Your Team"
            status={<StatusBadge status={team.status} icon={team.status === "shortlisted" ? Award : Users} />}
          >
            <div className="flex flex-col gap-[16px]">
              <div className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.1)] rounded-[15px] p-[20px] border border-[rgba(255,255,255,0.15)]">
                <div className="flex flex-col gap-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                      Team Name
                    </span>
                    <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      {team.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                      Team Code
                    </span>
                    <span className="text-[14px] text-white font-mono" style={{ fontFamily: 'var(--font-body)' }}>
                      {team.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                      Problem Statement
                    </span>
                    <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      {team.problemStatement}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                      Members
                    </span>
                    <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      {(team.members || []).length} / 5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                      Your Role
                    </span>
                    <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      {team.leadId === user.uid ? "Team Lead" : "Member"}
                    </span>
                  </div>
                </div>
              </div>

              {team.status === "submitted" && (
                <AlertBanner type="success" message="✅ Project submitted successfully!" />
              )}

              {team.status === "under-review" && (
                <AlertBanner type="warning" message="⏳ Your submission is being evaluated..." />
              )}

              {team.status === "shortlisted" && (
                <AlertBanner type="success" message="🎉 Congratulations! Your team has been shortlisted!" />
              )}

              <div className="flex gap-[12px]">
                {team.leadId === user.uid && team.status === "in-team" && (
                  <Button onClick={() => router.push("/dashboard/submission")} variant="primary">
                    <Upload className="w-4 h-4" />
                    Submit Project
                  </Button>
                )}
                {team.leadId === user.uid && team.status !== "submitted" && team.status !== "shortlisted" && team.status !== "confirmed" && (
                  <Button onClick={handleDeleteTeam} variant="danger">
                    <Trash2 className="w-4 h-4" />
                    Delete Team
                  </Button>
                )}
                {team.leadId !== user.uid && (
                  <Button
                    onClick={() => {
                      setTeam(null);
                      setAlert({ type: "info", message: "Left the team" });
                      setTimeout(() => setAlert(null), 3000);
                    }}
                    variant="danger"
                  >
                    <X className="w-4 h-4" />
                    Leave Team
                  </Button>
                )}
              </div>
            </div>
          </FormSection>

          {team.leadId === user.uid && (
            <>
              <FormSection title="Team Management (Team Lead)">
                <div className="flex flex-col gap-[12px]">
                  <div className="flex flex-col gap-[8px] p-[16px] rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(138,138,138,0.05)]">
                    <div 
                      onClick={() => {
                        if (team.status === "in-team") {
                          setTeam({ ...team, lookingForMembers: !team.lookingForMembers });
                        }
                      }}
                      className={`flex items-center gap-[12px] ${team.status === "in-team" ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="teamLookingForMembers"
                          checked={team.lookingForMembers}
                          onChange={(e) => {
                            if (team.status === "in-team") {
                              setTeam({ ...team, lookingForMembers: e.target.checked });
                            }
                          }}
                          disabled={team.status !== "in-team"}
                          className="sr-only"
                        />
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300
                          ${team.lookingForMembers 
                            ? 'border-[#ff4d00] bg-[rgba(255,77,0,0.15)]' 
                            : 'border-[rgba(255,255,255,0.38)] bg-[rgba(138,138,138,0.2)]'
                          }
                          ${team.status === "in-team" ? 'hover:border-[rgba(255,255,255,0.5)]' : ''}
                        `}>
                          {team.lookingForMembers && (
                            <Check className="w-3 h-3 text-[#ff4d00] animate-selectSlide" />
                          )}
                        </div>
                      </div>
                      <label htmlFor="teamLookingForMembers" className={`text-[14px] font-semibold text-white ${team.status === "in-team" ? 'cursor-pointer' : 'cursor-not-allowed'}`} style={{ fontFamily: 'var(--font-body)' }}>
                        Looking for team members
                      </label>
                    </div>
                    <p className={`text-[13px] text-white opacity-70 ml-[32px] ${team.status !== "in-team" ? 'opacity-50' : ''}`} style={{ fontFamily: 'var(--font-body)' }}>
                      Enable this to let others know your team is open to new members. Your team will appear in the "Discover" section for participants looking for teams.
                    </p>
                  </div>
                  <p className="text-[13px] text-[rgba(255,255,255,0.6)]" style={{ fontFamily: 'var(--font-body)' }}>
                    Share your team code <span className="font-mono text-white">{team.code}</span> with others to invite them.
                  </p>
                </div>
              </FormSection>

              {/* Team Members List */}
              {team.teamMembers && team.teamMembers.length > 0 && (
                <FormSection title="Team Members">
                  <div className="flex flex-col gap-[8px]">
                    {team.teamMembers.map((member: TeamMember) => (
                      <div
                        key={member.uid}
                        className="flex items-center justify-between p-[12px] bg-[rgba(138,138,138,0.1)] rounded-[8px] border border-[rgba(255,255,255,0.1)]"
                      >
                        <div className="flex flex-col gap-[4px]">
                          <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                            {member.name}
                            {member.role === 'Team Lead' && (
                              <span className="ml-[8px] text-[12px] text-[#ff4d00] opacity-80">
                                (Lead)
                              </span>
                            )}
                          </span>
                          {member.email && (
                            <span className="text-[12px] text-white opacity-60" style={{ fontFamily: 'var(--font-body)' }}>
                              {member.email}
                            </span>
                          )}
                        </div>
                        {member.uid !== user?.uid && team.status !== "submitted" && team.status !== "shortlisted" && team.status !== "confirmed" && (
                          <Button
                            onClick={() => handleRemoveMember(member.uid, member.name)}
                            variant="danger"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </FormSection>
              )}

              {/* Join Requests Section */}
              <FormSection title="Join Requests">
                {isLoadingRequests ? (
                  <div className="text-white text-center py-[20px] opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
                    Loading requests...
                  </div>
                ) : joinRequests.length === 0 ? (
                  <div className="text-white text-center py-[20px] opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
                    No pending join requests
                  </div>
                ) : (
                  <div className="flex flex-col gap-[12px]">
                    {joinRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className="flex items-center justify-between p-[12px] bg-[rgba(138,138,138,0.1)] rounded-[8px] border border-[rgba(255,255,255,0.1)]"
                      >
                        <div className="flex flex-col gap-[4px]">
                          <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                            {request.userName}
                          </span>
                          <span className="text-[12px] text-white opacity-60" style={{ fontFamily: 'var(--font-body)' }}>
                            {request.userEmail}
                          </span>
                          <span className="text-[12px] text-white opacity-50" style={{ fontFamily: 'var(--font-body)' }}>
                            Requested {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-[8px]">
                          <Button
                            onClick={() => handleUserClick(request.userId)}
                            variant="secondary"
                          >
                            <User className="w-4 h-4" />
                            View Profile
                          </Button>
                          <Button
                            onClick={() => handleRespondToRequest(request.requestId, 'accept')}
                            variant="primary"
                          >
                            <Check className="w-4 h-4" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRespondToRequest(request.requestId, 'decline')}
                            variant="danger"
                          >
                            <X className="w-4 h-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FormSection>
            </>
          )}
        </>
      )}

      {/* User Details Modal */}
      <UserProfileModal
        isOpen={!!selectedUserId}
        onClose={handleCloseUserModal}
        userDetails={userDetails}
        isLoading={isLoadingUser}
      />

      {/* Problem Statement Details Modal */}
      <Modal
        isOpen={!!selectedProblemStatement}
        onClose={() => setSelectedProblemStatement(null)}
        title={selectedProblemStatement?.title || "Problem Statement"}
      >
        <div className="flex flex-col gap-[16px]">
          <div>
            <p className="text-[15px] text-white opacity-80 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-body)' }}>
              {selectedProblemStatement?.description || "description goes here"}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

