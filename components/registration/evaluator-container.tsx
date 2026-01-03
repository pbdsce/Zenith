"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Eye, Clock, CheckCircle, Youtube, FileText, Link as LinkIcon, ExternalLink } from "lucide-react";
import { FormSection } from "./form-section";
import { CustomDropdown } from "./custom-dropdown";
import { FormTextarea } from "./form-textarea";
import { Button } from "./button";
import { Card } from "./card";
import { StatusBadge } from "./status-badge";
import { StickyAlert } from "./sticky-alert";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmationDialog } from "./confirmation-dialog";

interface AssignedTeam {
  teamCode: string;
  teamName: string;
  problemStatement: string;
  status: 'pending' | 'evaluated';
  submissionLinks?: {
    videoURL?: string;
    submissionPDF?: string;
    anyOtherLink?: string;
  };
}

interface EvaluationCriteria {
  tech: string;
  ux: string;
  presentation: string;
  comments: string;
}

export function EvaluatorContainer() {
  const { getToken } = useAuth();
  const [assignedTeams, setAssignedTeams] = useState<AssignedTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationCriteria>({
    tech: '',
    ux: '',
    presentation: '',
    comments: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    onConfirm: () => { },
  });

  useEffect(() => {
    const fetchAssignedTeams = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(API_ENDPOINTS.evaluatorTeams, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && Array.isArray(data.data.teams)) {
            const mappedTeams = data.data.teams.map((team: any) => ({
              teamCode: team.teamCode,
              teamName: team.teamName,
              problemStatement: team.appliedFor?.title || 'No Problem Statement',
              status: team.isEvaluated ? 'evaluated' : 'pending',
              submissionLinks: {
                videoURL: team.videoURL,
                submissionPDF: team.submissionPDF,
                anyOtherLink: team.anyOtherLink
              }
            }));
            setAssignedTeams(mappedTeams);
          }
        } else {
          console.error("Failed to fetch assigned teams:", response.status);
          setAlert({
            type: "warning",
            message: "Failed to load assigned teams."
          });
        }
      } catch (error) {
        console.error('Failed to fetch assigned teams:', error);
        setAlert({
          type: "error",
          message: "Failed to load assigned teams. Please refresh the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedTeams();
  }, [getToken]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      window.open(url, '_blank');
    }
  };



  const handleEvaluationSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTeam) return;

    setIsSubmitting(true);
    setAlert(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(API_ENDPOINTS.evaluatorEvaluate, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamCode: selectedTeam,
          scores: {
            tech: parseInt(evaluationData.tech),
            ux: parseInt(evaluationData.ux),
            presentation: parseInt(evaluationData.presentation),
          },
          comments: evaluationData.comments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit evaluation');
      }

      if (data.success) {
        setAlert({
          type: "success",
          message: "Evaluation submitted successfully!",
        });
        
        // Update team status
        setAssignedTeams(prev =>
          prev.map(team =>
            team.teamCode === selectedTeam
              ? { ...team, status: 'evaluated' as const }
              : team
          )
        );
        
        // Reset form
        setEvaluationData({
          tech: '',
          ux: '',
          presentation: '',
          comments: '',
        });
        setSelectedTeam(null);
        
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to submit evaluation",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTeam = assignedTeams.find(t => t.teamCode === selectedTeam);

  return (
    <div className="flex flex-col gap-[24px] w-full">
      {alert && (
        <StickyAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <FormSection title="Assigned Teams">
        {isLoading ? (
          <div className="flex justify-center py-[40px]">
            <Spinner size="lg" />
          </div>
        ) : assignedTeams.length === 0 ? (
          <div className="text-white text-center py-[40px] opacity-70">
            No teams have been assigned to you yet.
          </div>
        ) : (
          <div className="flex flex-col gap-[16px]">
            {assignedTeams.map((team) => (
              <Card key={team.teamCode}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-['Inter',sans-serif] text-[16px] text-white mb-[4px]">{team.teamName}</h3>
                    <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-70 mb-[8px]">
                      Problem: {team.problemStatement}
                    </p>
                    <div className="mt-2 w-fit">
                      <StatusBadge
                        status={team.status === 'evaluated' ? 'Evaluated' : 'Pending Evaluation'}
                        icon={team.status === 'evaluated' ? CheckCircle : Clock}
                      />
                    </div>
                  </div>
                  <Button
                    variant={team.status === 'evaluated' ? 'secondary' : 'primary'}
                    onClick={() => {
                      setSelectedTeam(team.teamCode);
                      // Pre-fill if already evaluated? Or clean...
                      setEvaluationData({
                        tech: '',
                        ux: '',
                        presentation: '',
                        comments: '',
                      });
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    {team.status === 'evaluated' ? 'View/Update' : 'Evaluate'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </FormSection>

      {selectedTeam && activeTeam && (
        <div className="flex flex-col gap-[24px]">

          {(activeTeam.submissionLinks?.videoURL || activeTeam.submissionLinks?.submissionPDF || activeTeam.submissionLinks?.anyOtherLink) && (
            <FormSection title="Submission Artifacts">
              <div className="flex flex-wrap gap-[12px]">
                {activeTeam.submissionLinks.videoURL && (
                  <a
                    href={activeTeam.submissionLinks.videoURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] bg-[#FF0000]/10 border border-[#FF0000]/20 px-[16px] py-[10px] rounded-[8px] hover:bg-[#FF0000]/20 transition-all group"
                  >
                    <Youtube className="w-5 h-5 text-[#FF0000] group-hover:scale-110 transition-transform" />
                    <span className="text-white text-[14px]">Watch Video Pitch</span>
                    <ExternalLink className="w-3 h-3 text-white/40" />
                  </a>
                )}
                {activeTeam.submissionLinks.submissionPDF && (
                  <button
                    onClick={() => handleDownload(activeTeam.submissionLinks!.submissionPDF!, 'presentation.pdf')}
                    className="flex items-center gap-[8px] bg-blue-500/10 border border-blue-500/20 px-[16px] py-[10px] rounded-[8px] hover:bg-blue-500/20 transition-all group cursor-pointer"
                  >
                    <FileText className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-[14px]">Download Presentation PDF</span>
                    <ExternalLink className="w-3 h-3 text-white/40" />
                  </button>
                )}
                {activeTeam.submissionLinks.anyOtherLink && (
                  <a
                    href={activeTeam.submissionLinks.anyOtherLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-[8px] bg-white/5 border border-white/10 px-[16px] py-[10px] rounded-[8px] hover:bg-white/10 transition-all group"
                  >
                    <LinkIcon className="w-5 h-5 text-white/70 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-[14px]">Additional Link</span>
                    <ExternalLink className="w-3 h-3 text-white/40" />
                  </a>
                )}
              </div>
            </FormSection>
          )}

          <FormSection title={`Evaluate: ${activeTeam.teamName}`}>
            <form onSubmit={handleEvaluationSubmit} className="flex flex-col gap-[24px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                <CustomDropdown
                  label="Technical Implementation"
                  options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
                  required
                  value={evaluationData.tech}
                  onChange={(value) => setEvaluationData({ ...evaluationData, tech: value })}
                />
                <CustomDropdown
                  label="User Experience (UX)"
                  options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
                  required
                  value={evaluationData.ux}
                  onChange={(value) => setEvaluationData({ ...evaluationData, ux: value })}
                />
                <CustomDropdown
                  label="Presentation"
                  options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
                  required
                  value={evaluationData.presentation}
                  onChange={(value) => setEvaluationData({ ...evaluationData, presentation: value })}
                />
              </div>
              <FormTextarea
                label="Evaluator Comments"
                placeholder="Provide constructive feedback (required for low scores)..."
                value={evaluationData.comments}
                onChange={(e) => setEvaluationData({ ...evaluationData, comments: e.target.value })}
                rows={4}
              />
              <div className="flex gap-[12px] justify-end border-t border-white/5 pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSelectedTeam(null);
                    setEvaluationData({
                      tech: '',
                      ux: '',
                      presentation: '',
                      comments: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (!evaluationData.tech || !evaluationData.ux || !evaluationData.presentation) {
                      setAlert({ type: "error", message: "Please rate all criteria before submitting." });
                      return;
                    }

                    setConfirmation({
                      isOpen: true,
                      onConfirm: () => handleEvaluationSubmit()
                    });
                  }}
                >
                  {isSubmitting && <Spinner size="sm" className="mr-2" />}
                  Submit Evaluation
                </Button>
              </div>
            </form>
          </FormSection>
        </div>
      )}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={async () => {
          const promise = confirmation.onConfirm();
          if (promise instanceof Promise) {
            await promise;
          }
          setConfirmation({ ...confirmation, isOpen: false });
        }}
        title="Submit Evaluation"
        message="Are you sure you want to submit this evaluation? This action cannot be undone."
      />
    </div>
  );
}

