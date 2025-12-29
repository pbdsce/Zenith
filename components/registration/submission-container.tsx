"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { Home, Upload, CheckCircle, X } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { FormFileUpload } from "./form-file-upload";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
import { AlertBanner } from "./alert-banner";
import { API_ENDPOINTS } from "@/lib/api-config";

interface Team {
  id: string;
  name: string;
  code: string;
  leadId: string;
  members: string[];
  status: "none" | "in-team" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined" | "withdrawn";
}

export function SubmissionContainer() {
  const { user, isAuthenticated, getToken } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [submissionData, setSubmissionData] = useState({
    videoUrl: "",
    projectLink: "",
  });
  const [documentationFile, setDocumentationFile] = useState<File | null>(null);
  const [documentationFileName, setDocumentationFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const fetchTeamData = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        if (!token) return;

        // Fetch user profile to get teamCode
        const userResponse = await fetch(API_ENDPOINTS.userProfile, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const profileData = userData.success ? userData.data : userData;
          const teamCode = profileData.teamCode;

          if (teamCode) {
            // Fetch team data
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
                  status: teamInfo.teamStatus === 'pending' ? 'in-team' :
                    teamInfo.teamStatus === 'submitted' ? 'submitted' :
                      teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                        teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                          teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                            teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'in-team',
                });
                
                // Set existing submission data if available
                if (teamInfo.videoURL) {
                  setSubmissionData(prev => ({ ...prev, videoUrl: teamInfo.videoURL }));
                }
                if (teamInfo.anyOtherLink) {
                  setSubmissionData(prev => ({ ...prev, projectLink: teamInfo.anyOtherLink }));
                }
                if (teamInfo.submissionPDF) {
                  setDocumentationFileName("submission.pdf");
                }
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

  const handleWithdrawSubmission = async () => {
    if (!team || !user) return;

    const confirmed = window.confirm(
      `Are you sure you want to withdraw the submission? All submission details (video, PDF, links) will be permanently deleted.`
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);
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
          teamCode: team.code,
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
            status: teamInfo.teamStatus === 'pending' ? 'in-team' :
              teamInfo.teamStatus === 'submitted' ? 'submitted' :
                teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                  teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                    teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                      teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'in-team',
          });
          
          // Clear submission data
          setSubmissionData({
            videoUrl: "",
            projectLink: "",
          });
          setDocumentationFile(null);
          setDocumentationFileName("");
        }
      }
    } catch (error) {
      console.error('Error withdrawing submission:', error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to withdraw submission",
      });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    if (!team) {
      setAlert({
        type: "error",
        message: "No team found",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setAlert({
          type: "error",
          message: "Authentication required",
        });
        setIsSubmitting(false);
        return;
      }

      // First upload submission files (if not already submitted)
      if (team.status !== "submitted") {
        const formData = new FormData();
        formData.append('teamCode', team.code);
        if (submissionData.videoUrl) {
          formData.append('videoURL', submissionData.videoUrl);
        }
        if (documentationFile) {
          formData.append('submissionPDF', documentationFile);
        }
        if (submissionData.projectLink) {
          formData.append('anyOtherLink', submissionData.projectLink);
        }

        const uploadResponse = await fetch(API_ENDPOINTS.uploadSubmission, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          throw new Error(uploadData.message || 'Failed to upload submission');
        }
      }

      // Then submit the application (final submission)
      const submitResponse = await fetch(API_ENDPOINTS.submitApplication, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamCode: team.code,
        }),
      });

      const submitData = await submitResponse.json();

      if (!submitResponse.ok) {
        throw new Error(submitData.message || 'Failed to submit application');
      }

      // Update team status
      setTeam({
        ...team,
        status: "submitted",
      });

      setAlert({
        type: "success",
        message: "Team submitted successfully!",
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to submit project",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white" style={{ fontFamily: 'var(--font-body)' }}>Loading...</div>
      </div>
    );
  }

  if (!user || !team) {
    return (
      <div className="flex flex-col gap-[24px] max-w-[700px] w-full">
        <AlertBanner type="warning" message="You need to be part of a team to submit a project." />
        <Button onClick={() => router.push("/dashboard/team")} variant="primary">
          Go to Team Management
        </Button>
      </div>
    );
  }

  // Check if user is team lead
  const isTeamLead = team.leadId === user.uid;
  if (!isTeamLead) {
    return (
      <div className="flex flex-col gap-[24px] max-w-[700px] w-full">
        <AlertBanner type="warning" message="Only team leaders can submit projects." />
        <Button onClick={() => router.push("/dashboard")} variant="primary">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isLocked = team.status !== "in-team" && team.status !== "submitted";
  const canWithdraw = team.status === "submitted" && !isLocked;

  return (
    <div className="flex flex-col gap-[24px] max-w-[700px] w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-[42px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Team Submission
        </h1>
        <Button onClick={() => router.push("/dashboard")} variant="secondary">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      {isLocked && (
        <AlertBanner type="warning" message="Submission is locked. Changes are not allowed after evaluation phase." />
      )}

      <form onSubmit={handleSubmitProject} className="flex flex-col gap-[24px]">
        <FormSection
          title="Project Details"
          status={team.status === "submitted" ? <StatusBadge status="Submitted" icon={CheckCircle} /> : undefined}
        >
          <FormInput
            label="YouTube Pitch Video Link"
            placeholder="https://youtube.com/watch?v=..."
            required
            value={submissionData.videoUrl}
            onChange={(e) => setSubmissionData({ ...submissionData, videoUrl: e.target.value })}
          />
          <p className="text-[13px] text-[rgba(255,255,255,0.6)]" style={{ fontFamily: 'var(--font-body)' }}>
            Upload a pitch video explaining your project idea and solution.
          </p>
          <FormFileUpload
            label="Project Documentation (PDF)"
            accept=".pdf"
            required
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setDocumentationFile(e.target.files[0]);
                setDocumentationFileName(e.target.files[0].name);
              }
            }}
            currentFile={documentationFileName}
          />
          {/* <FormInput
            label="Project Link (Optional)"
            placeholder="https://github.com/team/project"
            value={submissionData.projectLink}
            onChange={(e) => setSubmissionData({ ...submissionData, projectLink: e.target.value })}
          /> */}
          <p className="text-[13px] text-[rgba(255,255,255,0.6)] mt-[-8px]" style={{ fontFamily: 'var(--font-body)' }}>
            Make sure all links are accessible and working before submitting. You can update your submission before the deadline.
          </p>
        </FormSection>

        <div className="flex gap-[12px]">
          <Button type="submit" variant="primary" disabled={isLocked || isSubmitting}>
            <Upload className="w-4 h-4" />
            {team.status === "submitted" ? "Update Submission" : "Submit Project"}
          </Button>
          {canWithdraw && (
            <Button onClick={handleWithdrawSubmission} variant="danger" disabled={isSubmitting}>
              <X className="w-4 h-4" />
              Withdraw Submission
            </Button>
          )}
          <Button onClick={() => router.push("/dashboard/team")} variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

