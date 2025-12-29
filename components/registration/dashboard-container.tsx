"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import {
  Home,
  UserCircle,
  Users,
  FileText,
  Upload,
  Edit,
  CheckCircle,
  Clock,
  Award,
  AlertCircle,
  X,
  Check,
  Search,
  Trash2,
  LogOut,
} from "lucide-react";
import { FormSection } from "./form-section";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
import { AlertBanner } from "./alert-banner";

interface Team {
  teamCode: string;
  teamName: string;
  teamLead: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
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
  const [team, setTeam] = useState<Team | null>(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [rsvpStatus, setRsvpStatus] = useState<"pending" | "confirmed" | "declined">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);

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
                  } else {
                    // Clear team if response doesn't have expected structure
                    setTeam(null);
                  }
                } else {
                  // Team fetch failed (not found, unauthorized, etc.), clear team state
                  setTeam(null);
                }
              } catch (error) {
                console.error('Error fetching team data:', error);
                // Team fetch failed, clear team state
                setTeam(null);
              }
            } else {
              // User doesn't have a teamCode, clear team state
              setTeam(null);
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

  const getTeamStatus = (): "none" | "in-team" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined" => {
    if (!team || !team.teamStatus) return "none";
    // Map teamStatus from API to component status
    const statusMap: Record<string, "none" | "in-team" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined"> = {
      'pending': 'in-team',
      'submitted': 'submitted',
      'withdrawn': 'none',
      'shortlisted': 'shortlisted',
      'rsvped': 'confirmed',
      'rsvp_declined': 'declined',
    };
    return statusMap[team.teamStatus] || 'in-team';
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

    const confirmed = window.confirm(
      `Are you sure you want to delete the team "${team.teamName}"? This action cannot be undone. All team members will be removed from the team.`
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
          teamCode: team.teamCode,
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
      setTimeout(() => setAlert(null), 3000);

      // Clear team state and refresh profile
      setTeam(null);
      setTimeout(() => {
        window.location.reload(); // Refresh to update UI
      }, 1000);
    } catch (error) {
      console.error('Error deleting team:', error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete team",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team || !user) return;
    
    if (!confirm("Are you sure you want to leave this team?")) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.leaveTeam, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ setLookingStatus: false })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to leave team');
      }

      // Clear team state and refresh
      setTeam(null);
      
      // Trigger refresh to reload data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error leaving team:', error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : 'Failed to leave team',
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleWithdrawSubmission = async () => {
    if (!team || !user) return;

    const confirmed = window.confirm(
      `Are you sure you want to withdraw the submission for "${team.teamName}"? All submission details (video, PDF, links) will be permanently deleted.`
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

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!team || !user) return;
    
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

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
          memberId,
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
        <div className="text-white" style={{ fontFamily: 'var(--font-body)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const teamStatus = getTeamStatus();

  return (
    <div className="flex flex-col gap-[24px] max-w-[900px] w-full">
      {alert && <AlertBanner type={alert.type} message={alert.message} />}
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
        {team && isTeamLead() && getTeamStatus() === "in-team" && (
          <Button onClick={() => router.push("/dashboard/submission")} variant="secondary">
            <FileText className="w-4 h-4" />
            Submit Team
          </Button>
        )}
      </div>

      {/* Profile Completeness */}
      <FormSection
        title="Profile Status"
        status={
          <StatusBadge
            status={profileCompleteness === 100 ? "Completed" : "Pending"}
            icon={profileCompleteness === 100 ? CheckCircle : Clock}
          />
        }
      >
        <div className="flex flex-col gap-[12px]">
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
              Profile Completeness
            </span>
            <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
              {profileCompleteness}%
            </span>
          </div>
          <div className="w-full bg-[rgba(138,138,138,0.2)] rounded-full h-[8px] overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#ff4d00] to-[#ff8800] h-full transition-all duration-500"
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
          {missingFields.length > 0 && (
            <div className="flex flex-col gap-[8px]">
              <p className="text-[12px] text-white opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
                Missing fields:
              </p>
              <div className="flex flex-wrap gap-[6px]">
                {missingFields.map((field, index) => (
                  <span
                    key={index}
                    className="text-[11px] text-white opacity-60 bg-[rgba(138,138,138,0.2)] px-[8px] py-[4px] rounded-[4px] border border-[rgba(255,255,255,0.1)]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profileCompleteness < 100 && (
            <Button onClick={() => router.push("/dashboard/profile")} variant="secondary">
              Complete Profile
            </Button>
          )}
        </div>
      </FormSection>

      {/* Team Status */}
      <FormSection
        title="Team Status"
        status={
          <StatusBadge
            status={teamStatus}
            icon={
              teamStatus === "none"
                ? AlertCircle
                : teamStatus === "shortlisted" || teamStatus === "confirmed"
                ? Award
                : Users
            }
          />
        }
      >
        <div className="flex flex-col gap-[16px]">
          {teamStatus === "none" ? (
            <>
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
            </>
          ) : team ? (
            <>
              <div className="flex flex-col gap-[8px]">
                <div className="flex justify-between">
                  <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                    Team Name
                  </span>
                  <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    {team.teamName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                    Team Code
                  </span>
                  <span className="text-[14px] text-white font-mono" style={{ fontFamily: 'var(--font-body)' }}>
                    {team.teamCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                    Members
                  </span>
                  <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    {team.memberCount} / 4
                  </span>
                </div>
                {team.appliedFor && (
                  <div className="flex justify-between">
                    <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                      Problem Statement
                    </span>
                    <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      {team.appliedFor.title}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                    Your Role
                  </span>
                  <span className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    {isTeamLead() ? "Team Lead" : "Member"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                    Team Status
                  </span>
                  <StatusBadge
                    status={team.teamStatus}
                    icon={
                      teamStatus === "shortlisted" || teamStatus === "confirmed"
                        ? Award
                        : Users
                    }
                  />
                </div>
              </div>

              {teamStatus === "in-team" && isTeamLead() && (
                <Button onClick={() => router.push("/dashboard/submission")} variant="primary">
                  <FileText className="w-4 h-4" />
                  Submit Team
                </Button>
              )}

              {teamStatus === "submitted" && (
                <AlertBanner type="yellow" message="Project submitted! Waiting for evaluation." />
              )}

              {teamStatus === "under-review" && (
                <AlertBanner type="warning" message="Your project is under review by evaluators." />
              )}

              {teamStatus === "shortlisted" && rsvpStatus === "pending" && (
                <div className="flex flex-col gap-[12px]">
                  <AlertBanner type="success" message="🎉 Congratulations! Your team has been shortlisted!" />
                  <p className="text-[14px] text-white" style={{ fontFamily: 'var(--font-body)' }}>
                    Please confirm your participation:
                  </p>
                  <div className="flex gap-[12px]">
                    <Button onClick={() => handleRSVP("confirmed")} variant="primary">
                      <Check className="w-4 h-4" />
                      Confirm Participation
                    </Button>
                    <Button onClick={() => handleRSVP("declined")} variant="danger">
                      <X className="w-4 h-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {teamStatus === "confirmed" && (
                <AlertBanner type="success" message="✅ RSVP Confirmed! See you at the event!" />
              )}

              {/* Team Members List - Admin can edit */}
              {team.teamMembers && team.teamMembers.length > 0 && (
                <div className="flex flex-col gap-[12px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-white opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
                      Team Members
                    </span>
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    {team.teamMembers.map((member: any) => (
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
                        {(isAdmin() || isTeamLead()) && member.uid !== user?.uid && teamStatus !== "submitted" && teamStatus !== "shortlisted" && teamStatus !== "confirmed" && (
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
                </div>
              )}

              {/* Leave Team Button for Members */}
              {!isTeamLead() && teamStatus !== "submitted" && teamStatus !== "shortlisted" && teamStatus !== "confirmed" && (
                <Button onClick={handleLeaveTeam} variant="danger">
                  <LogOut className="w-4 h-4" />
                  Leave Team
                </Button>
              )}

              {/* Edit Team Details and Delete Team Buttons - Only for Team Lead */}
              {isTeamLead() && (
                <div className="flex gap-[12px] flex-wrap">
                  <Button onClick={() => router.push("/dashboard/team")} variant="secondary">
                    <Edit className="w-4 h-4" />
                    Edit Team Details
                  </Button>
                  {teamStatus === "submitted" && !team.isEvaluated && !team.isShortlisted && (
                    <Button onClick={() => router.push("/dashboard/submission")} variant="secondary">
                      <FileText className="w-4 h-4" />
                      Edit Submission
                    </Button>
                  )}
                  {teamStatus !== "submitted" && teamStatus !== "shortlisted" && teamStatus !== "confirmed" && (
                    <Button onClick={handleDeleteTeam} variant="danger">
                      <Trash2 className="w-4 h-4" />
                      Delete Team
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </FormSection>

      {/* Quick Actions */}
      {/* <FormSection title="Quick Actions">
        <div className="grid grid-cols-2 gap-[12px]">
          <Button onClick={() => router.push("/dashboard/profile")} variant="secondary">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
          <Button onClick={() => router.push("/dashboard/discover")} variant="secondary">
            <Search className="w-4 h-4" />
            Discover
          </Button>
          {!team && (
            <Button onClick={() => router.push("/dashboard/team")} variant="secondary">
              <Users className="w-4 h-4" />
              Team Management
            </Button>
          )}
          {team && isTeamLead() && (
            <>
              {team.teamStatus === "submitted" && !team.isEvaluated && !team.isShortlisted && (
                <>
                  <Button onClick={() => router.push("/dashboard/submission")} variant="secondary">
                    <Edit className="w-4 h-4" />
                    Edit Submission
                  </Button>
                  <Button onClick={handleWithdrawSubmission} variant="danger">
                    <X className="w-4 h-4" />
                    Withdraw Submission
                  </Button>
                </>
              )}
              {team.teamStatus !== "submitted" && (
                <Button onClick={() => router.push("/dashboard/submission")} variant="secondary">
                  <Upload className="w-4 h-4" />
                  Submit Project
                </Button>
              )}
            </>
          )}
        </div>
      </FormSection> */}
    </div>
  );
}

