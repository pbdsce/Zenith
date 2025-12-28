"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Home, Users, Upload, X, Award } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { FormSelect } from "./form-select";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
import { AlertBanner } from "./alert-banner";

interface Team {
  id: string;
  name: string;
  code: string;
  leadId: string;
  members: string[];
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

    // Fetch team data if user has teamCode
    const fetchTeam = async () => {
      try {
        if (user.teamCode) {
          const token = await getToken();
          const response = await fetch(API_ENDPOINTS.getTeam(user.teamCode), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setTeam(data.data);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching team:", error);
      }
    };

    fetchTeam();
  }, [user, isAuthenticated, router, getToken]);

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
        setTeam(data.data);
        setAlert({
          type: "success",
          message: `Joined team "${data.data.teamName}"!`,
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
          )}
        </>
      )}
    </div>
  );
}

