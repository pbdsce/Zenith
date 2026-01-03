"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Eye, Clock, CheckCircle, Settings } from "lucide-react";
import { FormSection } from "./form-section";
import { FormSelect } from "./form-select";
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
}

interface EvaluationCriteria {
  innovation: string;
  technical: string;
  presentation: string;
  impact: string;
  comments: string;
}

export function EvaluatorContainer() {
  const { getToken } = useAuth();
  const [assignedTeams, setAssignedTeams] = useState<AssignedTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationCriteria>({
    innovation: '',
    technical: '',
    presentation: '',
    impact: '',
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
              status: team.isEvaluated ? 'evaluated' : 'pending'
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
          innovation: parseInt(evaluationData.innovation),
          technical: parseInt(evaluationData.technical),
          presentation: parseInt(evaluationData.presentation),
          impact: parseInt(evaluationData.impact),
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
          innovation: '',
          technical: '',
          presentation: '',
          impact: '',
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
                    <StatusBadge
                      status={team.status === 'evaluated' ? 'Evaluated' : 'Pending Evaluation'}
                      icon={team.status === 'evaluated' ? CheckCircle : Clock}
                    />
                  </div>
                  <Button
                    variant={team.status === 'evaluated' ? 'secondary' : 'primary'}
                    onClick={() => setSelectedTeam(team.teamCode)}
                  >
                    <Eye className="w-4 h-4" />
                    {team.status === 'evaluated' ? 'View' : 'Evaluate'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </FormSection>

      {selectedTeam && (
        <FormSection title="Evaluate Team">
          <form onSubmit={handleEvaluationSubmit} className="flex flex-col gap-[20px]">
            <FormSelect
              label="Innovation (1-10)"
              options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
              required
              value={evaluationData.innovation}
              onChange={(e) => setEvaluationData({ ...evaluationData, innovation: e.target.value })}
            />
            <FormSelect
              label="Technical Implementation (1-10)"
              options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
              required
              value={evaluationData.technical}
              onChange={(e) => setEvaluationData({ ...evaluationData, technical: e.target.value })}
            />
            <FormSelect
              label="Presentation (1-10)"
              options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
              required
              value={evaluationData.presentation}
              onChange={(e) => setEvaluationData({ ...evaluationData, presentation: e.target.value })}
            />
            <FormSelect
              label="Impact & Usefulness (1-10)"
              options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
              required
              value={evaluationData.impact}
              onChange={(e) => setEvaluationData({ ...evaluationData, impact: e.target.value })}
            />
            <FormTextarea
              label="Additional Comments"
              placeholder="Provide detailed feedback for the team..."
              value={evaluationData.comments}
              onChange={(e) => setEvaluationData({ ...evaluationData, comments: e.target.value })}
              rows={4}
            />
            <div className="flex gap-[12px]">
              <Button
                type="button"
                variant="primary"
                disabled={isSubmitting}
                onClick={() => {
                  if (!evaluationData.innovation || !evaluationData.technical || !evaluationData.presentation || !evaluationData.impact) {
                    setAlert({ type: "error", message: "Please fill all required fields before submitting." });
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedTeam(null);
                  setEvaluationData({
                    innovation: '',
                    technical: '',
                    presentation: '',
                    impact: '',
                    comments: '',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </FormSection>
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

