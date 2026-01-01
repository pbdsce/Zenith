"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { Home, Users, Upload, X, Award, Check, UserPlus, Trash2, User, ExternalLink, Copy, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";
import { AlertBanner } from "./alert-banner";
import { UserProfileModal, UserDetails } from "./user-profile-modal";
import { Modal } from "./modal";
import { EditProblemStatementModal } from "./edit-problem-statement-modal";
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
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

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
  status: "none" | "active" | "submitted" | "under-review" | "shortlisted" | "confirmed" | "declined" | "withdrawn";
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
  const [userError, setUserError] = useState<string | null>(null);
  
  // Problem statement modal state
  const [selectedProblemStatement, setSelectedProblemStatement] = useState<ProblemStatement | null>(null);
  
  // Confirmation dialog state
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [leaveTeamDialogOpen, setLeaveTeamDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  
  // Tabbed UI state for Create/Join
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Copy state for team code
  const [copied, setCopied] = useState(false);
  
  // Edit problem statement modal state
  const [editPsModalOpen, setEditPsModalOpen] = useState(false);
  const [isUpdatingPs, setIsUpdatingPs] = useState(false);
  
  // Collapsible requests state
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  
  const { toast } = useToast();

  // Memoized filtered requests
  const incomingRequests = useMemo(() => 
    joinRequests.filter(r => r.type === 'request'), [joinRequests]
  );
  const sentInvites = useMemo(() => 
    joinRequests.filter(r => r.type === 'invite'), [joinRequests]
  );

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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load problem statements. Please refresh the page."
        });
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
                  problemStatement: teamInfo.appliedFor?.title || '',
                  lookingForMembers: teamInfo.isLooking || false,
                  status: teamInfo.teamStatus === 'pending' ? 'active' :
                    teamInfo.teamStatus === 'submitted' ? 'submitted' :
                      teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                        teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                          teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                            teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'active',
                });

                // Join requests will be fetched by useEffect when team state is set
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load team data. Please try again."
        });
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load join requests."
      });
      setJoinRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!team?.code) return;
    try {
      await navigator.clipboard.writeText(team.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy team code:", err);
    }
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
          teamCode: team.code,
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

      // Clear team state and redirect to dashboard
      setTeam(null);
      setDeleteTeamDialogOpen(false);
      setTimeout(() => {
        router.push("/dashboard");
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

  const handleRemoveMemberClick = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setRemoveMemberDialogOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!team || !user || !memberToRemove) return;

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
          memberId: memberToRemove.id,
          setTheirLookingStatus: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove member');
      }

      toast({
        title: "Member removed",
        description: `${memberToRemove.name} has been removed from the team`,
      });
      setRemoveMemberDialogOpen(false);
      setMemberToRemove(null);

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
            status: teamInfo.teamStatus === 'pending' ? 'active' :
              teamInfo.teamStatus === 'submitted' ? 'submitted' :
                teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                  teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                    teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                      teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'active',
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
          teamCode: team.code
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
      setTeam(null);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
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

  const handleUserClick = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingUser(true);
    setUserError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        setUserError("Authentication required");
        setIsLoadingUser(false);
        return;
      }

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
        } else {
          setUserError(data.message || "Failed to load user details");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setUserError(errorData.message || "Failed to fetch user details");
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserError("Network error. Please try again.");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleCloseUserModal = () => {
    setSelectedUserId(null);
    setUserDetails(null);
    setUserError(null);
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
              problemStatement: teamInfo.appliedFor?.title || '',
              lookingForMembers: teamInfo.isLooking || false,
              status: teamInfo.teamStatus === 'pending' ? 'active' :
                teamInfo.teamStatus === 'submitted' ? 'submitted' :
                  teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                    teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                      teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                        teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'active',
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

  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const sendInvite = async (email: string) => {
    if (!team) return;
    setIsInviting(true);
    setAlert(null);

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.joinRequest, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamCode: team.code,
          type: 'invite',
          email: email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation');
      }

      setAlert({
        type: "success",
        message: "Invitation sent successfully!"
      });
      setInviteEmail("");

      // Refresh requests
      fetchJoinRequests(team.code, token);

    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to invite user"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendInvite(inviteEmail);
  };

  const handleToggleLookingForMembers = async (value: boolean) => {
    if (!team) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.lookingForMembers, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          teamCode: team.code, 
          isLooking: value 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update setting');
      }

      setTeam({ ...team, lookingForMembers: value });
      toast({ 
        title: value ? "Team visible in Discover" : "Team hidden from Discover",
        description: value 
          ? "Other participants can now find and request to join your team" 
          : "Your team is now hidden from the Discover section"
      });
    } catch (error) {
      console.error('Error toggling looking for members:', error);
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error instanceof Error ? error.message : "Could not update setting"
      });
    }
  };

  const handleUpdateProblemStatement = async (problemStatementId: string, title: string) => {
    if (!team) return;
    
    setIsUpdatingPs(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.updateProblemStatement, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          teamCode: team.code, 
          problemStatementId 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update problem statement');
      }

      setTeam({ ...team, problemStatement: title });
      toast({ 
        title: "Problem statement updated",
        description: `Changed to: ${title}`
      });
    } catch (error) {
      console.error('Error updating problem statement:', error);
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error instanceof Error ? error.message : "Could not update problem statement"
      });
    } finally {
      setIsUpdatingPs(false);
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
        const teamCode = data.data.teamCode;
        
        // Fetch full team data after creation
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
              problemStatement: teamInfo.appliedFor?.title || '',
              lookingForMembers: teamInfo.isLooking || false,
              status: teamInfo.teamStatus === 'pending' ? 'active' :
                teamInfo.teamStatus === 'submitted' ? 'submitted' :
                  teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                    teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                      teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                        teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'active',
            });
          }
        }
        
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
        const joinedTeamCode = data.data.teamCode;
        
        // Fetch full team data after joining (same pattern as create)
        const teamResponse = await fetch(API_ENDPOINTS.getTeam(joinedTeamCode), {
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
              problemStatement: teamInfo.appliedFor?.title || '',
              lookingForMembers: teamInfo.isLooking || false,
              status: teamInfo.teamStatus === 'pending' ? 'active' :
                teamInfo.teamStatus === 'submitted' ? 'submitted' :
                  teamInfo.teamStatus === 'shortlisted' ? 'shortlisted' :
                    teamInfo.teamStatus === 'rsvped' ? 'confirmed' :
                      teamInfo.teamStatus === 'rsvp_declined' ? 'declined' :
                        teamInfo.teamStatus === 'withdrawn' ? 'withdrawn' : 'active',
            });
          }
        }
        
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
        <Spinner size="lg" />
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
          {/* Tab Navigation */}
          <div className="flex gap-[4px] p-[4px] bg-[rgba(138,138,138,0.1)] rounded-[12px] border border-[rgba(255,255,255,0.1)]">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-[12px] px-[20px] rounded-[8px] text-[14px] font-medium transition-all duration-300 ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-[#ff4d00] to-[#ff8800] text-white shadow-[0_4px_15px_rgba(255,77,0,0.3)]'
                  : 'text-white opacity-70 hover:opacity-100'
              }`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Create Team
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-[12px] px-[20px] rounded-[8px] text-[14px] font-medium transition-all duration-300 ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-[#ff4d00] to-[#ff8800] text-white shadow-[0_4px_15px_rgba(255,77,0,0.3)]'
                  : 'text-white opacity-70 hover:opacity-100'
              }`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Join Team
            </button>
          </div>

          {/* Create Team Form */}
          {activeTab === 'create' && (
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
                    Select a Problem Statement <span className="text-[#ff4d00]">*</span>
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
                  {!teamFormData.problemStatement && (
                    <p className="text-[12px] text-[#ff4d00]" style={{ fontFamily: 'var(--font-body)' }}>
                      Please select a problem statement to continue
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-[8px] p-[16px] rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(138,138,138,0.05)]">
                    <div className="flex items-center gap-[12px]">
                      <Switch
                        id="lookingForMembers"
                        checked={teamFormData.lookingForMembers}
                        onCheckedChange={(checked) => setTeamFormData({ ...teamFormData, lookingForMembers: checked })}
                        className="data-[state=checked]:bg-[#ff4d00] border-[#ff4d00]"
                      />
                    <label htmlFor="lookingForMembers" className="text-[14px] font-semibold text-white cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
                      Looking for team members
                    </label>
                  </div>
                  <p className="text-[13px] text-white opacity-70 ml-[32px]" style={{ fontFamily: 'var(--font-body)' }}>
                    Enable this to let others know your team is open to new members. Your team will appear in the "Discover" section for participants looking for teams.
                  </p>
                </div>
                <Button type="submit" variant="primary" disabled={isSubmitting || !teamFormData.problemStatement}>
                  {isSubmitting ? <Spinner size="sm" className="mr-2" /> : <Users className="w-4 h-4" />}
                  {isSubmitting ? 'Creating...' : 'Create Team'}
                </Button>
              </form>
            </FormSection>
          )}

          {/* Join Team Form */}
          {activeTab === 'join' && (
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
                  {isSubmitting && <Spinner size="sm" className="mr-2" />}
                  {isSubmitting ? 'Joining...' : 'Join Team'}
                </Button>
              </form>
            </FormSection>
          )}
        </>
      ) : (
        <>
          <FormSection
            title="Your Team"
            status={team.status !== "active" ? <StatusBadge status={team.status} icon={team.status === "shortlisted" ? Award : Users} /> : undefined}
          >
            <div className="flex flex-col gap-[16px]">
              {/* Two-column grid for Team Info + Problem Statement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                {/* Team Info Card */}
                <div className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.1)] rounded-[12px] p-[16px] border border-[rgba(255,255,255,0.15)]">
                  <h3 className="text-[12px] uppercase tracking-wider text-white opacity-50 mb-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                    Team Info
                  </h3>
                  <div className="flex flex-col gap-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-white opacity-70" style={{ fontFamily: 'var(--font-body)' }}>Name</span>
                      <span className="text-[14px] text-white font-medium" style={{ fontFamily: 'var(--font-body)' }}>{team.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-white opacity-70" style={{ fontFamily: 'var(--font-body)' }}>Code</span>
                      <div className="flex items-center gap-[6px]">
                        <span className="text-[14px] text-white font-mono bg-[rgba(138,138,138,0.2)] px-[8px] py-[2px] rounded-[4px]">{team.code}</span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-[4px] rounded-[4px] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                          title="Copy team code"
                        >
                          {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-white opacity-60" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-white opacity-70" style={{ fontFamily: 'var(--font-body)' }}>Members</span>
                      <div className="flex items-center gap-[6px]">
                        <div className="flex -space-x-2">
                          {(team.teamMembers || []).slice(0, 4).map((member, i) => (
                            <div 
                              key={member.uid}
                              className="w-[24px] h-[24px] rounded-full bg-gradient-to-br from-[#ff4d00] to-[#ff8800] flex items-center justify-center text-[10px] text-white font-semibold border-2 border-[#1a1a1a]"
                              title={member.name}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="text-[13px] text-white opacity-60">{(team.members || []).length}/4</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-white opacity-70" style={{ fontFamily: 'var(--font-body)' }}>Role</span>
                      <span className={`text-[12px] px-[8px] py-[2px] rounded-full ${team.leadId === user.uid ? 'bg-[rgba(255,77,0,0.2)] text-[#ff8800]' : 'bg-[rgba(138,138,138,0.2)] text-white opacity-70'}`} style={{ fontFamily: 'var(--font-body)' }}>
                        {team.leadId === user.uid ? "Team Lead" : "Member"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Problem Statement Card */}
                <div className="backdrop-blur-[2.5px] backdrop-filter bg-[rgba(138,138,138,0.1)] rounded-[12px] p-[16px] border border-[rgba(255,255,255,0.15)] flex flex-col">
                  <div className="flex justify-between items-start mb-[8px]">
                    <h3 className="text-[12px] uppercase tracking-wider text-white opacity-50" style={{ fontFamily: 'var(--font-body)' }}>
                      Problem Statement
                    </h3>
                    {team.leadId === user.uid && team.status === "active" && (
                      <button
                        onClick={() => setEditPsModalOpen(true)}
                        className="flex items-center gap-[4px] text-[11px] text-[#ff8800] hover:text-[#ff4d00] transition-colors"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        <Edit className="w-3 h-3" />
                        Change
                      </button>
                    )}
                  </div>
                  {team.problemStatement ? (
                    <h4 className="text-[15px] text-white font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                      {team.problemStatement}
                    </h4>
                  ) : (
                    <p className="text-[14px] text-white opacity-60" style={{ fontFamily: 'var(--font-body)' }}>
                      No problem statement selected yet
                    </p>
                  )}
                  {team.leadId === user.uid && team.problemStatement && (
                    <p className="text-[12px] text-white opacity-50 mt-[8px]" style={{ fontFamily: 'var(--font-body)' }}>
                      {team.status === "active" 
                        ? "You can change this before submitting" 
                        : "Locked after submission"}
                    </p>
                  )}
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
                {team.leadId === user.uid && team.status === "active" && (
                  <Button onClick={() => router.push("/dashboard/submission")} variant="primary">
                    <Upload className="w-4 h-4" />
                    Submit Project
                  </Button>
                )}
                {team.leadId === user.uid && team.status !== "submitted" && team.status !== "shortlisted" && team.status !== "confirmed" && (
                  <Button onClick={() => setDeleteTeamDialogOpen(true)} variant="danger">
                    <Trash2 className="w-4 h-4" />
                    Delete Team
                  </Button>
                )}
                {team.leadId !== user.uid && (
                  <Button
                    onClick={() => setLeaveTeamDialogOpen(true)}
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
                    <div className="flex items-center gap-[12px]">
                      <Switch
                        id="teamLookingForMembers"
                        checked={team.lookingForMembers}
                        onCheckedChange={(checked) => {
                          if (team.status === "active") {
                            handleToggleLookingForMembers(checked);
                          }
                        }}
                        disabled={team.status !== "active"}
                        className="data-[state=checked]:bg-[#ff4d00] border-[#ff4d00]"
                      />
                      <label htmlFor="teamLookingForMembers" className={`text-[14px] font-semibold text-white ${team.status === "active" ? 'cursor-pointer' : 'cursor-not-allowed'}`} style={{ fontFamily: 'var(--font-body)' }}>
                        Looking for team members
                      </label>
                    </div>
                    <p className={`text-[13px] text-white opacity-70 ml-[32px] ${team.status !== "active" ? 'opacity-50' : ''}`} style={{ fontFamily: 'var(--font-body)' }}>
                      Enable this to let others know your team is open to new members. Your team will appear in the "Discover" section for participants looking for teams.
                    </p>
                  </div>
                  <p className="text-[13px] text-[rgba(255,255,255,0.6)] flex items-center gap-[8px]" style={{ fontFamily: 'var(--font-body)' }}>
                    Share your team code 
                    <span className="font-mono text-white bg-[rgba(138,138,138,0.2)] px-[8px] py-[4px] rounded-[4px]">{team.code}</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-[6px] rounded-[4px] bg-[rgba(138,138,138,0.2)] hover:bg-[rgba(138,138,138,0.3)] transition-colors"
                      title={copied ? "Copied!" : "Copy team code"}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <Copy className="w-3 h-3 text-white" />
                      )}
                    </button>
                    with others to invite them.
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
                            onClick={() => handleRemoveMemberClick(member.uid, member.name)}
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

              {/* Invite Members Section */}
              {team.leadId === user.uid && team.status === "active" && team.members.length < 4 && (
                <FormSection title="Invite Members">
                  <form onSubmit={handleInviteMember} className="flex gap-[12px] items-end">
                    <div className="flex-1">
                      <FormInput
                        label="User Email"
                        placeholder="Enter user email to invite"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        type="email"
                        required
                      />
                    </div>
                    <Button type="submit" variant="primary" disabled={isInviting}>
                      {isInviting ? <Spinner size="sm" className="mr-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                      {isInviting ? "Inviting..." : "Invite"}
                    </Button>
                  </form>
                </FormSection>
              )}

              {/* Incoming Join Requests */}
              <FormSection title="Incoming Requests">
                {isLoadingRequests ? (
                  <div className="flex justify-center py-[20px]">
                    <Spinner size="md" />
                  </div>
                ) : incomingRequests.length === 0 ? (
                  <div className="text-white text-center py-[20px] opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
                    No incoming join requests
                  </div>
                ) : (
                  <div className="flex flex-col gap-[12px]">
                    {incomingRequests.map((request) => (
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

              {/* Sent Invitations */}
              {team.leadId === user.uid && (
                <FormSection title="Sent Invitations">
                  {isLoadingRequests ? (
                    <div className="flex justify-center py-[20px]">
                      <Spinner size="md" />
                    </div>
                  ) : sentInvites.length === 0 ? (
                    <div className="text-white text-center py-[20px] opacity-70" style={{ fontFamily: 'var(--font-body)' }}>
                      No pending invitations
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[12px]">
                      {sentInvites.map((request) => (
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
                              Invited {new Date(request.requestedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-[8px] items-center">
                            <span className="text-[12px] text-white font-medium px-2 py-1 bg-[rgba(255,77,0,0.15)] border border-[#ff8800] rounded">
                              Pending
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </FormSection>
              )}
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
        onInvite={() => {
          if (userDetails?.email) {
            setInviteEmail(userDetails.email);
            sendInvite(userDetails.email);
          }
        }}
        isInviting={userDetails ? isInviting && inviteEmail === userDetails.email : false}
        isInvited={false} // Team container doesn't track sent invites per user easily
        canInvite={false} // Invite logic is different in team container (by email)
        error={userError}
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

      {/* Delete Team Confirmation Dialog */}
      <AlertDialog open={deleteTeamDialogOpen} onOpenChange={setDeleteTeamDialogOpen}>
        <AlertDialogContent className="bg-[rgba(138,138,138,0.15)] backdrop-blur-[2.5px] border-[rgba(255,255,255,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Delete Team
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80" style={{ fontFamily: 'var(--font-body)' }}>
              Are you sure you want to delete the team "{team?.name}"? This action cannot be undone. All team members will be removed from the team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white" style={{ fontFamily: 'var(--font-body)' }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-black/50 hover:bg-black/60 text-white border border-[#ff4d00]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Delete
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
              onClick={handleRemoveMember}
              className="bg-black/50 hover:bg-black/60 text-white border border-[#ff4d00]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Remove
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
              Are you sure you want to leave the team "{team?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white" style={{ fontFamily: 'var(--font-body)' }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveTeam}
              className="bg-black/50 hover:bg-black/60 text-white border border-[#ff4d00]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Leave Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Problem Statement Modal */}
      <EditProblemStatementModal
        isOpen={editPsModalOpen}
        onClose={() => setEditPsModalOpen(false)}
        currentStatement={team?.problemStatement || ""}
        problemStatements={problemStatements}
        onSubmit={handleUpdateProblemStatement}
        isLoading={isUpdatingPs}
      />
    </div>
  );
}

