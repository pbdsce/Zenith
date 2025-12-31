"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import {
  Home,
  UserCircle,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Check,
  Search,
} from "lucide-react";
import { FormSection } from "./form-section";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
import { AlertBanner } from "./alert-banner";
import { TeamOverviewCard } from "./team-overview-card";
import { TeamMembersCard } from "./team-members-card";
import { QuickActionsCard } from "./quick-actions-card";
import { SubmissionStatusCard } from "./submission-status-card";
import { DeadlineTimer } from "./deadline-timer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

interface Team {
  teamCode: string;
  teamName: string;
  teamLead: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    discord_username?: string;
    organisation?: string;
    resume_link?: string;
    github_link?: string;
  };
  teamMembers: Array<{
    uid: string;
    name: string;
    email?: string;
    organisation?: string;
    role: string;
    joinedAt?: Date;
  }>;
  memberCount: number;
  teamStatus: string;
  isLooking: boolean;
  appliedFor?: {
    id: string;
    title: string;
  } | null;
  videoURL?: string;
  submissionPDF?: string;
  anyOtherLink?: string;
  isEvaluated?: boolean;
  evaluator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  scores?: any;
  comments?: string;
  isShortlisted?: boolean;
  createdAt?: Date;
  submittedAt?: Date;
}

export function DashboardContainer() {
  const { user, isAuthenticated, getToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [rsvpStatus, setRsvpStatus] = useState<"pending" | "confirmed" | "declined">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [leaveTeamDialogOpen, setLeaveTeamDialogOpen] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [teamRequests, setTeamRequests] = useState<any[]>([]);
  const [isDeadlineExpired, setIsDeadlineExpired] = useState(false);
  const [withdrawSubmissionDialogOpen, setWithdrawSubmissionDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  const handleRespondToInvite = async (requestId: string, action: 'accept' | 'decline') => {
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
        throw new Error(data.message || `Failed to ${action} invitation`);
      }

      toast({
        title: action === 'accept' ? "Invitation Accepted" : "Invitation Declined",
        description: data.message,
      });

      // Refresh data
      setRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to respond",
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Fetch real data from API
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get Firebase auth token (automatically refreshed by Firebase SDK)
        const token = await getToken();
        if (!token) {
          router.push("/login");
          return;
        }
        
        // Fetch user profile from authenticated endpoint
        const userResponse = await fetch(API_ENDPOINTS.userProfile, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch deadline status
        try {
          const deadlineResponse = await fetch('/api/config/deadline');
          const deadlineData = await deadlineResponse.json();
          if (deadlineData.success && deadlineData.data) {
            setIsDeadlineExpired(deadlineData.data.isExpired);
          }
        } catch (error) {
          console.error("Error fetching deadline:", error);
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Failed to load deadline information."
          });
        }

        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Profile API returns data directly (not wrapped in success/data)
          const profileData = userData.success ? userData.data : userData;
          
          if (profileData) {
            // Calculate profile completeness based on ALL profile fields (excluding system fields)
            // Define all profile fields with their human-readable labels
            const profileFields = [
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'discord_username', label: 'Discord' },
              { key: 'age', label: 'Age' },
              { key: 'organisation', label: 'Organisation' },
              { key: 'bio', label: 'Bio' },
              { key: 'profile_picture', label: 'Profile Picture' },
              { key: 'resume_link', label: 'Resume' },
              { key: 'github_link', label: 'GitHub' },
              { key: 'linkedin_link', label: 'LinkedIn' },
              { key: 'leetcode_profile', label: 'LeetCode' },
              { key: 'codeforces_link', label: 'Codeforces' },
              { key: 'kaggle_link', label: 'Kaggle' },
              { key: 'devfolio_link', label: 'Devfolio' },
              { key: 'portfolio_link', label: 'Portfolio' },
              { key: 'ctf_profile', label: 'CTF Profile' },
            ];
            
            let completed = 0;
            const missing: string[] = [];
            
            profileFields.forEach((field) => {
              const value = profileData[field.key];
              // Check if field exists and is not null/empty
              if (value && value !== null && value !== '') {
                completed++;
              } else {
                missing.push(field.label);
              }
            });
            
            const percentage = Math.round((completed / profileFields.length) * 100);
            setProfileCompleteness(percentage);
            setMissingFields(missing);

            // Fetch team data if user has a teamCode
            if (profileData.teamCode) {
              try {
                // Fetch team data from the team endpoint
                const teamResponse = await fetch(API_ENDPOINTS.getTeam(profileData.teamCode), {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });

                if (teamResponse.ok) {
                  const teamData = await teamResponse.json();
                  if (teamData.success && teamData.data) {
                    setTeam(teamData.data);
                    
                    // Fetch team requests if lead
                    const teamInfo = teamData.data;
                    const teamCode = teamInfo.teamCode;
                    if (teamInfo.teamLead === user.uid || (typeof teamInfo.teamLead === 'object' && teamInfo.teamLead.id === user.uid)) {
                      try {
                        const requestsResponse = await fetch(`${API_ENDPOINTS.joinRequest}?teamCode=${teamCode}&type=team`, {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        });
                        if (requestsResponse.ok) {
                          const requestsData = await requestsResponse.json();
                          if (requestsData.success && requestsData.data && requestsData.data.requests) {
                             setTeamRequests(requestsData.data.requests.filter((r: any) => r.type === 'request' && r.status === 'pending'));
                          }
                        }
                      } catch (error) {
                        console.error("Error fetching team requests:", error);
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Failed to load team join requests."
                        });
                      }
                    }
                  } else {
                    setTeam(null);
                  }
                } else {
                  setTeam(null);
                }
              } catch (error) {
                console.error('Error fetching team data:', error);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Failed to load team details."
                });
                setTeam(null);
              }
            } else {
              setTeam(null);
            }

            // Always fetch invites (Team -> User) regardless of team status
            try {
              const invitesResponse = await fetch(`${API_ENDPOINTS.joinRequest}?type=user`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (invitesResponse.ok) {
                const invitesData = await invitesResponse.json();
                if (invitesData.success && invitesData.data && invitesData.data.requests) {
                  setInvites(invitesData.data.requests.filter((r: any) => r.type === 'invite' && r.status === 'pending'));
                }
              }
            } catch (error) {
              console.error("Error fetching invites:", error);
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load team invitations."
              });
            }
          } else {
            // If API doesn't return expected format, calculate from context user
            calculateProfileFromContext();
          }
        } else {
          // If API fails, calculate from context user
          calculateProfileFromContext();
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data. Please refresh the page."
        });
        // Calculate from context user as fallback
        calculateProfileFromContext();
      } finally {
        setIsLoading(false);
      }
    };

    // Fallback: Calculate from user context if API fails
    const calculateProfileFromContext = () => {
      const profileFields = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'discord_username', label: 'Discord' },
        { key: 'age', label: 'Age' },
        { key: 'organisation', label: 'Organisation' },
        { key: 'bio', label: 'Bio' },
        { key: 'profile_picture', label: 'Profile Picture' },
        { key: 'resume_link', label: 'Resume' },
        { key: 'github_link', label: 'GitHub' },
        { key: 'linkedin_link', label: 'LinkedIn' },
        { key: 'leetcode_profile', label: 'LeetCode' },
        { key: 'codeforces_link', label: 'Codeforces' },
        { key: 'kaggle_link', label: 'Kaggle' },
        { key: 'devfolio_link', label: 'Devfolio' },
        { key: 'portfolio_link', label: 'Portfolio' },
        { key: 'ctf_profile', label: 'CTF Profile' },
      ];
      
      let completed = 0;
      const missing: string[] = [];
      
      profileFields.forEach((field) => {
        if (!user) return;
        const value = user[field.key as keyof typeof user];
        if (value && value !== null && value !== '') {
          completed++;
        } else {
          missing.push(field.label);
        }
      });
      
      setProfileCompleteness(Math.round((completed / profileFields.length) * 100));
      setMissingFields(missing);
    };

    fetchData();
  }, [user, isAuthenticated, router, refreshTrigger]);

  const getTeamStatus = (): "none" | "active" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined" => {
    if (!team || !team.teamStatus) return "none";
    // Map teamStatus from API to component status
    const statusMap: Record<string, "none" | "active" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined"> = {
      'pending': 'active',
      'submitted': 'submitted',
      'withdrawn': 'none',
      'shortlisted': 'shortlisted',
      'rsvped': 'confirmed',
      'rsvp_declined': 'declined',
    };
    return statusMap[team.teamStatus] || 'active';
  };

  const isTeamLead = (): boolean => {
    if (!team || !user) return false;
    // Check if user is the team lead by checking teamMembers array
    const userMember = team.teamMembers?.find((member: any) => member.uid === user.uid);
    return userMember?.role === 'Team Lead' || false;
  };

  const handleRSVP = (status: "confirmed" | "declined") => {
    setRsvpStatus(status);
    // TODO: Call API to update RSVP status
  };

  const handleDeleteTeam = async () => {
    if (!team || !user) return;

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
          teamCode: team.teamCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete team');
      }

      toast({
        title: "Team deleted",
        description: "Team has been deleted successfully.",
      });
      setDeleteTeamDialogOpen(false);

      // Clear team state and refresh profile
      setTeam(null);
      setTimeout(() => {
        window.location.reload(); // Refresh to update UI
      }, 1000);
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete team",
        description: error instanceof Error ? error.message : "Failed to delete team",
      });
      setDeleteTeamDialogOpen(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team || !user) return;

    try {
      const token = await getToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in again to leave the team",
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.leaveTeam, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamCode: team.teamCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to leave team');
      }

      toast({
        title: "Left team",
        description: "You have successfully left the team",
      });
      setLeaveTeamDialogOpen(false);
      
      // Clear team state and refresh
      setTeam(null);
      
      // Trigger refresh to reload data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error leaving team:', error);
      toast({
        variant: "destructive",
        title: "Failed to leave team",
        description: error instanceof Error ? error.message : "Failed to leave team",
      });
      setLeaveTeamDialogOpen(false);
    }
  };

  const handleWithdrawSubmission = () => {
    setWithdrawSubmissionDialogOpen(true);
  };

  const executeWithdrawSubmission = async () => {
    if (!team || !user) return;

    try {
      const token = await getToken();
      if (!token) {
        setAlert({
          type: "error",
          message: "Authentication required",
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.withdrawSubmission, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamCode: team.teamCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to withdraw submission');
      }

      setAlert({
        type: "success",
        message: "Submission withdrawn successfully. You can now submit again.",
      });
      setTimeout(() => setAlert(null), 3000);

      // Refresh team data
      const teamResponse = await fetch(API_ENDPOINTS.getTeam(team.teamCode), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        if (teamData.success && teamData.data) {
          setTeam(teamData.data);
        }
      }
    } catch (error) {
      console.error('Error withdrawing submission:', error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to withdraw submission",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setRemoveMemberDialogOpen(true);
  };

  const executeRemoveMember = async () => {
    if (!team || !user || !memberToRemove) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.removeMember, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamCode: team.teamCode,
          memberId: memberToRemove.id,
          setTheirLookingStatus: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove member');
      }

      // Refresh team data
      const teamResponse = await fetch(API_ENDPOINTS.getTeam(team.teamCode), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        if (teamData.success && teamData.data) {
          setTeam(teamData.data);
        }
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : 'Failed to remove member',
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const teamStatus = getTeamStatus();

  return (
    <div className="flex flex-col gap-[24px] max-w-[1100px] w-full">
      {alert && <AlertBanner type={alert.type} message={alert.message} />}
      
      {/* Header */}
      <div className="flex flex-col gap-[12px] items-center text-center">
        <h1 className="text-[48px] text-white leading-[52px] tracking-[-1px]" style={{ fontFamily: 'var(--font-heading)' }}>
          Welcome, {user.name}!
        </h1>
        <p className="text-[15.9px] text-white opacity-90 leading-[23.8px]" style={{ fontFamily: 'var(--font-body)' }}>
          Manage your profile, team, and submissions from your dashboard.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-[12px] justify-center">
        <Button onClick={() => router.push("/dashboard")} variant="primary">
          <Home className="w-4 h-4" />
          Dashboard
        </Button>
        <Button onClick={() => router.push("/dashboard/profile")} variant="secondary">
          <UserCircle className="w-4 h-4" />
          Profile
        </Button>
        <Button onClick={() => router.push("/dashboard/team")} variant="secondary">
          <Users className="w-4 h-4" />
          Team
        </Button>
      </div>

      {/* Submission Deadline Timer */}
      <DeadlineTimer teamStatus={team?.teamStatus} hasSubmitted={teamStatus === 'submitted' || teamStatus === 'shortlisted' || teamStatus === 'confirmed'} />

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 flex flex-col gap-[24px]">
          {/* Team Status for Users Without a Team */}
          {teamStatus === "none" && (
            <FormSection
              title="Team Status"
              status={<StatusBadge status="none" icon={AlertCircle} />}
            >
              <div className="flex flex-col gap-[16px]">
                <AlertBanner 
                  type="warning" 
                  message="Important: Even if you want to participate alone, you still need to create a team to submit your project." 
                />
                <p className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                  You're not part of a team yet. Create or join a team to participate in the hackathon.
                </p>
                <div className="flex gap-[12px]">
                  <Button onClick={() => router.push("/dashboard/team")} variant="primary">
                    <Users className="w-4 h-4" />
                    Create / Join Team
                  </Button>
                  <Button onClick={() => router.push("/dashboard/discover")} variant="secondary">
                    <Search className="w-4 h-4" />
                    Discover Teams
                  </Button>
                </div>
              </div>
            </FormSection>
          )}

          {/* Team Overview Card */}
          {team && teamStatus !== "none" && (
            <TeamOverviewCard
              team={{
                teamName: team.teamName,
                teamCode: team.teamCode,
                memberCount: team.memberCount,
                maxMembers: 4,
                problemStatement: team.appliedFor?.title,
              }}
              isLead={isTeamLead()}
              status={teamStatus}
            />
          )}

          {/* Team Members Card */}
          {team && team.teamMembers && team.teamMembers.length > 0 && (
            <TeamMembersCard
              members={team.teamMembers}
              isLead={isTeamLead()}
              teamStatus={teamStatus}
              currentUserId={user.uid}
              onRemoveMember={handleRemoveMember}
            />
          )}

          {/* Submission Status Card (for submitted/shortlisted teams) */}
          {team && (teamStatus === "submitted" || teamStatus === "under-review" || teamStatus === "shortlisted" || teamStatus === "confirmed" || teamStatus === "declined") && (
            <SubmissionStatusCard
              status={teamStatus as "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined"}
              rsvpStatus={rsvpStatus}
              submittedAt={team.submittedAt}
              onRSVP={handleRSVP}
            />
          )}
        </div>

        {/* Right Column - 1/3 width */}
        <div className="flex flex-col gap-[24px]">
          {/* Compact Profile Status */}
          <FormSection
            title="Profile Status"
          >
            <div className="flex flex-col gap-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                  Completeness
                </span>
                <span className="text-[14px] text-white font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                  {profileCompleteness}%
                </span>
              </div>
              <div className="w-full bg-[rgba(138,138,138,0.2)] rounded-full h-[8px] overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ff4d00] to-[#ff8800] h-full transition-all duration-500"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
              {profileCompleteness < 100 && (
                <p
                  onClick={() => router.push("/dashboard/profile")}
                  className="text-[12px] text-[#ff8800] opacity-80 cursor-pointer hover:opacity-100 transition-opacity break-words text-center"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {missingFields.length} fields missing → Complete now
                </p>
              )}
            </div>
          </FormSection>

          {/* Quick Actions Card */}
          {team && teamStatus !== "none" && (
            <QuickActionsCard
              isLead={isTeamLead()}
              teamStatus={teamStatus}
              isEvaluated={team.isEvaluated}
              isShortlisted={team.isShortlisted}
              memberCount={team.memberCount}
              maxMembers={4}
              onNavigate={(path) => router.push(path)}
              onDeleteTeam={() => setDeleteTeamDialogOpen(true)}
              onLeaveTeam={() => setLeaveTeamDialogOpen(true)}
              onWithdrawSubmission={handleWithdrawSubmission}
              isDeadlineExpired={isDeadlineExpired}
            />
          )}

          {/* Pending Join Requests (for Team Leads) */}
          {teamRequests.length > 0 && (
            <FormSection title="Pending Join Requests">
              <div className="flex flex-col gap-[12px]">
                {teamRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className="flex flex-col gap-[8px] p-[12px] bg-[rgba(138,138,138,0.1)] rounded-[12px] border border-[rgba(255,255,255,0.1)] min-w-0 items-center text-center"
                  >
                    <span className="text-[14px] text-white break-words" style={{ fontFamily: 'var(--font-body)' }}>
                      <span className="font-semibold">{request.userName}</span> wants to join your team
                    </span>
                    <span className="text-[12px] text-white opacity-50 break-all" style={{ fontFamily: 'var(--font-body)' }}>
                      Email: {request.userEmail}
                    </span>
                    <div className="flex flex-wrap gap-[8px] w-full">
                      <Button
                        onClick={() => handleRespondToInvite(request.requestId, 'accept')}
                        variant="primary"
                        className="flex-1 min-w-[100px]"
                      >
                        <Check className="w-4 h-4 mr-2" /> Accept
                      </Button>
                      <Button
                        onClick={() => handleRespondToInvite(request.requestId, 'decline')}
                        variant="danger"
                        className="flex-1 min-w-[100px]"
                      >
                        <X className="w-4 h-4 mr-2" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>
          )}

          {/* Team Invitations (for Users) */}
          {invites.length > 0 && (
            <FormSection title="Team Invitations">
              <div className="flex flex-col gap-[12px]">
                {invites.map((invite) => (
                  <div
                    key={invite.requestId}
                    className="flex flex-col gap-[8px] p-[12px] bg-[rgba(138,138,138,0.1)] rounded-[12px] border border-[rgba(255,255,255,0.1)] min-w-0 items-center text-center"
                  >
                    <span className="text-[14px] text-white break-words" style={{ fontFamily: 'var(--font-body)' }}>
                      Invited to join <span className="font-semibold">{invite.teamName || invite.teamCode}</span>
                    </span>
                    <span className="text-[12px] text-white opacity-50 break-all" style={{ fontFamily: 'var(--font-body)' }}>
                      Code: <span className="font-mono">{invite.teamCode}</span>
                    </span>
                    <div className="flex flex-wrap gap-[8px] w-full">
                      <Button
                        onClick={() => handleRespondToInvite(invite.requestId, 'accept')}
                        variant="primary"
                        className="flex-1 min-w-[100px]"
                      >
                        <Check className="w-4 h-4 mr-2" /> Accept
                      </Button>
                      <Button
                        onClick={() => handleRespondToInvite(invite.requestId, 'decline')}
                        variant="danger"
                        className="flex-1 min-w-[100px]"
                      >
                        <X className="w-4 h-4 mr-2" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>
          )}
        </div>
      </div>

      {/* Commented out Quick Actions - now using QuickActionsCard */}

      {/* Delete Team Confirmation Dialog */}
      <AlertDialog open={deleteTeamDialogOpen} onOpenChange={setDeleteTeamDialogOpen}>
        <AlertDialogContent className="bg-[rgba(138,138,138,0.15)] backdrop-blur-[2.5px] border-[rgba(255,255,255,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Delete Team
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80" style={{ fontFamily: 'var(--font-body)' }}>
              Are you sure you want to delete the team "{team?.teamName}"? This action cannot be undone and all team data including members and submissions will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white" style={{ fontFamily: 'var(--font-body)' }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-red-600 hover:bg-red-700 text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdraw Submission Confirmation Dialog */}
      <AlertDialog open={withdrawSubmissionDialogOpen} onOpenChange={setWithdrawSubmissionDialogOpen}>
        <AlertDialogContent className="bg-[rgba(138,138,138,0.15)] backdrop-blur-[2.5px] border-[rgba(255,255,255,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Withdraw Submission
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80" style={{ fontFamily: 'var(--font-body)' }}>
              Are you sure you want to withdraw the submission for "{team?.teamName}"? All submission details (video, PDF, links) will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white" style={{ fontFamily: 'var(--font-body)' }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeWithdrawSubmission}
              className="bg-red-600 hover:bg-red-700 text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Withdraw Submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
        <AlertDialogContent className="bg-[rgba(138,138,138,0.15)] backdrop-blur-[2.5px] border-[rgba(255,255,255,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Remove Member
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80" style={{ fontFamily: 'var(--font-body)' }}>
              Are you sure you want to remove {memberToRemove?.name} from the team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white" style={{ fontFamily: 'var(--font-body)' }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRemoveMember}
              className="bg-red-600 hover:bg-red-700 text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Team Confirmation Dialog */}
      <AlertDialog open={leaveTeamDialogOpen} onOpenChange={setLeaveTeamDialogOpen}>
        <AlertDialogContent className="bg-[rgba(138,138,138,0.15)] backdrop-blur-[2.5px] border-[rgba(255,255,255,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Leave Team
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80" style={{ fontFamily: 'var(--font-body)' }}>
              Are you sure you want to leave the team "{team?.teamName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white" style={{ fontFamily: 'var(--font-body)' }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveTeam}
              className="bg-red-600 hover:bg-red-700 text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Leave Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

