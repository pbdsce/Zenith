"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { Home, Upload, CheckCircle } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { FormFileUpload } from "./form-file-upload";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
import { AlertBanner } from "./alert-banner";

interface Team {
  id: string;
  name: string;
  code: string;
  leadId: string;
  members: string[];
  status: "none" | "in-team" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined";
}

interface SubmissionContainerProps {
  onNavigate: (view: "dashboard" | "profile" | "team" | "submission") => void;
}

export function SubmissionContainer({ onNavigate }: SubmissionContainerProps) {
  const { user, isAuthenticated } = useAuth();
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

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // TODO: Fetch team data from API
    // For now, set to null
    setTeam(null);
  }, [user, isAuthenticated, router]);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      // TODO: Call API to submit project
      if (team) {
        const updatedTeam: Team = {
          ...team,
          status: "submitted",
        };
        setTeam(updatedTeam);
        setAlert({
          type: "success",
          message: "Project submitted successfully!",
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to submit project",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !team) {
    return (
      <div className="flex flex-col gap-[24px] max-w-[700px] w-full">
        <AlertBanner type="warning" message="You need to be part of a team to submit a project." />
        <Button onClick={() => onNavigate("team")} variant="primary">
          Go to Team Management
        </Button>
      </div>
    );
  }

  const isLocked = team.status !== "in-team" && team.status !== "submitted";

  return (
    <div className="flex flex-col gap-[24px] max-w-[700px] w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-[42px] text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Project Submission
        </h1>
        <Button onClick={() => onNavigate("dashboard")} variant="secondary">
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
            label="YouTube Video Link"
            placeholder="https://youtube.com/watch?v=..."
            required
            value={submissionData.videoUrl}
            onChange={(e) => setSubmissionData({ ...submissionData, videoUrl: e.target.value })}
          />
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
          <FormInput
            label="Project Link (Optional)"
            placeholder="https://github.com/team/project"
            value={submissionData.projectLink}
            onChange={(e) => setSubmissionData({ ...submissionData, projectLink: e.target.value })}
          />
          <p className="text-[13px] text-[rgba(255,255,255,0.6)]" style={{ fontFamily: 'var(--font-body)' }}>
            Make sure all links are accessible and working before submitting. You can update your submission before the deadline.
          </p>
        </FormSection>

        <div className="flex gap-[12px]">
          <Button type="submit" variant="primary" disabled={isLocked || isSubmitting}>
            <Upload className="w-4 h-4" />
            {team.status === "submitted" ? "Update Submission" : "Submit Project"}
          </Button>
          <Button onClick={() => onNavigate("team")} variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

