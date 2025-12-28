"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Home, Users, Upload, X, Award, Check, UserPlus, Trash2 } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { FormSelect } from "./form-select";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
import { AlertBanner } from "./alert-banner";

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
  status: "none" | "in-team" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined";
}

interface ProblemStatement {
  id: string;
  title: string;
}

interface TeamContainerProps {
  onNavigate: (view: "dashboard" | "profile" | "team" | "submission") => void;
}

export function TeamContainer({ onNavigate }: TeamContainerProps) {
  const { user, isAuthenticated, getToken } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState({
    teamName: "",
    problemStatement: "",
    lookingForMembers: false,
    joinCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);

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
        const token = await getToken();
        if (!token) return;

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
                          teamInfo.teamStatus === 'rsvped' ? 'confirmed' : 'in-team',
                });

                // Join requests will be fetched by useEffect when team state is set
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
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
        onNavigate("dashboard");
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
                    teamInfo.teamStatus === 'rsvped' ? 'confirmed' : 'in-team',
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
                      teamInfo.teamStatus === 'rsvped' ? 'confirmed' : 'in-team',
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
                  teamInfo.teamStatus === 'rsvped' ? 'confirmed' : 'in-team',
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

  return (
    <div className="flex flex-col gap-[24px] max-w-[700px] w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-[42px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Team Management
        </h1>
        <Button onClick={() => onNavigate("dashboard")} variant="secondary">
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
              <FormSelect
                label="Problem Statement"
                options={problemStatements.map(ps => ps.title)}
                required
                value={teamFormData.problemStatement}
                onChange={(e) => setTeamFormData({ ...teamFormData, problemStatement: e.target.value })}
              />
              <div className="flex items-center gap-[12px]">
                <input
                  type="checkbox"
                  id="lookingForMembers"
                  checked={teamFormData.lookingForMembers}
                  onChange={(e) => setTeamFormData({ ...teamFormData, lookingForMembers: e.target.checked })}
                  className="w-5 h-5 rounded border-[rgba(255,255,255,0.38)] bg-[rgba(138,138,138,0.2)] accent-[#ff4d00] cursor-pointer"
                />
                <label htmlFor="lookingForMembers" className="text-[14px] text-white cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
                  Looking for team members
                </label>
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
                  <Button onClick={() => onNavigate("submission")} variant="primary">
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
                  <div className="flex items-center gap-[12px]">
                    <input
                      type="checkbox"
                      id="teamLookingForMembers"
                      checked={team.lookingForMembers}
                      onChange={(e) => setTeam({ ...team, lookingForMembers: e.target.checked })}
                      className="w-5 h-5 rounded border-[rgba(255,255,255,0.38)] bg-[rgba(138,138,138,0.2)] accent-[#ff4d00] cursor-pointer"
                      disabled={team.status !== "in-team"}
                    />
                    <label htmlFor="teamLookingForMembers" className="text-[14px] text-white cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
                      Looking for team members
                    </label>
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
    </div>
  );
}

