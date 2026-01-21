import React, { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { UserCircle, Users, FileText, CheckCircle, Search, Download, Eye, Star, Upload, ChevronDown, ChevronUp, Check, X, Clock } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { Button } from "./button";
import { Card } from "./card";
import { StickyAlert } from "./sticky-alert";
import { Spinner } from "@/components/ui/spinner";
import { TeamDetailsModal, TeamDetails } from "./team-details-modal";
import { UserProfileModal, UserDetails } from "./user-profile-modal";
import { Modal } from "./modal";
import { FormTextarea } from "./form-textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvaluatorsTab } from "./evaluators-tab";
import { ConfirmationDialog } from "./confirmation-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface AdminStats {
  totalUsers: number;
  totalTeams: number;
  totalSubmissions: number;
  totalEvaluated: number;
}

interface Team {
  teamCode: string;
  teamName: string;
  problemStatement: string;
  memberCount: number;
  status: string;
  videoURL?: string;
  submissionPDF?: string;
  anyOtherLink?: string;
}

interface Participant {
  id: string;
  uid: string;
  name: string;
  email: string;
  teamName: string | null;
  isLooking: boolean;
}

export function AdminContainer() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTeams: 0,
    totalSubmissions: 0,
    totalEvaluated: 0,
  });

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  // Users State
  const [users, setUsers] = useState<Participant[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Teams State
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsPage, setTeamsPage] = useState(1);
  const [teamsTotalPages, setTeamsTotalPages] = useState(1);
  const [teamsSearch, setTeamsSearch] = useState("");
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);

  // Submissions State
  const [submissions, setSubmissions] = useState<Team[]>([]);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsTotalPages, setSubmissionsTotalPages] = useState(1);
  const [submissionsSearch, setSubmissionsSearch] = useState("");
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  interface SelectedTeam extends Team {
    memberRSVPs?: Array<{
      uid: string;
      name: string;
      rsvpStatus: "confirmed" | "declined";
      rsvpedAt: Date | string;
    }>;
    teamMembers?: Array<{
      uid: string;
      name: string;
      email?: string;
      role: string;
    }>;
  }
  const [selectedTeams, setSelectedTeams] = useState<SelectedTeam[]>([]);
  const [selectedTeamsPage, setSelectedTeamsPage] = useState(1);
  const [selectedTeamsTotalPages, setSelectedTeamsTotalPages] = useState(1);
  const [selectedTeamsSearch, setSelectedTeamsSearch] = useState("");
  const [isSelectedTeamsLoading, setIsSelectedTeamsLoading] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // View Modal State
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);

  // State for User Profile Modal
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);

  // Add PS Modal State
  const [isAddPSModalOpen, setIsAddPSModalOpen] = useState(false);
  const [newPsTitle, setNewPsTitle] = useState("");
  const [newPsDescription, setNewPsDescription] = useState("");
  const [isAddingPs, setIsAddingPs] = useState(false);

  // Confirmation Dialog State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    variant?: "default" | "danger";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  // Fetch Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`${API_ENDPOINTS.adminParticipants}?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.stats) {
          }
        }

        const [usersRes, teamsRes] = await Promise.all([
          fetch(`${API_ENDPOINTS.adminParticipants}?limit=1`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_ENDPOINTS.adminTeams}?limit=1`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (usersRes.ok && teamsRes.ok) {
          const usersData = await usersRes.json();
          const teamsData = await teamsRes.json();

          setStats({
            totalUsers: usersData.data?.stats?.totalParticipants || 0,
            totalTeams: teamsData.data?.stats?.totalTeams || 0,
            totalSubmissions: teamsData.data?.stats?.submitted || 0,
            totalEvaluated: teamsData.data?.stats?.evaluated || 0,
          });
        }

      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, [getToken]);

  // Fetch Users
  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: usersPage.toString(),
        limit: '10', // Fixed limit for now
        search: usersSearch
      });

      const response = await fetch(`${API_ENDPOINTS.adminParticipants}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.participants);
        setUsersTotalPages(data.data.pagination.totalPages);
      } else {
        setAlert({ type: "error", message: "Failed to fetch users" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Error fetching users" });
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [usersPage, usersSearch, activeTab, getToken]);


  // Fetch Teams
  const fetchTeams = async () => {
    setIsTeamsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: teamsPage.toString(),
        limit: '10',
        search: teamsSearch
      });

      const response = await fetch(`${API_ENDPOINTS.adminTeams}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const teamsList = data.data.teams || [];
        const mappedTeams: Team[] = teamsList.map((t: any) => ({
          teamCode: t.teamCode,
          teamName: t.teamName,
          problemStatement: t.appliedFor?.title || "N/A",
          memberCount: t.memberCount,
          status: t.teamStatus
        }));
        setTeams(mappedTeams);
        setTeamsTotalPages(data.data.pagination.totalPages);
      } else {
        setAlert({ type: "error", message: "Failed to fetch teams" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Error fetching teams" });
    } finally {
      setIsTeamsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'teams') {
      const timeoutId = setTimeout(() => {
        fetchTeams();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [teamsPage, teamsSearch, activeTab, getToken]);

  // Fetch Submissions
  const fetchSubmissions = async () => {
    setIsSubmissionsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: submissionsPage.toString(),
        limit: '10',
        search: submissionsSearch,
        isSubmitted: 'true'
      });

      const response = await fetch(`${API_ENDPOINTS.adminTeams}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const teamsList = data.data.teams || [];
        const mappedTeams: Team[] = teamsList.map((t: any) => ({
          teamCode: t.teamCode,
          teamName: t.teamName,
          problemStatement: t.appliedFor?.title || "N/A",
          memberCount: t.memberCount,
          status: t.teamStatus,
          videoURL: t.videoURL,
          submissionPDF: t.submissionPDF,
          anyOtherLink: t.anyOtherLink
        }));
        setSubmissions(mappedTeams);
        setSubmissionsTotalPages(data.data.pagination.totalPages);
      } else {
        setAlert({ type: "error", message: "Failed to fetch submissions" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Error fetching submissions" });
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'submissions') {
      const timeoutId = setTimeout(() => {
        fetchSubmissions();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [submissionsPage, submissionsSearch, activeTab, getToken]);
  const fetchSelectedTeams = async () => {
    setIsSelectedTeamsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const queryParams = new URLSearchParams({
        page: selectedTeamsPage.toString(),
        limit: '50',
        search: selectedTeamsSearch,
        evaluationTier: 'accepted,strongly_accepted'
      });
      const response = await fetch(`${API_ENDPOINTS.adminTeams}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const teamsList = data.data.teams || [];
        const teamsWithDetails = await Promise.all(
          teamsList.map(async (t: any) => {
            try {
              const detailResponse = await fetch(API_ENDPOINTS.adminTeamDetails(t.teamCode), {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                if (detailData.success && detailData.data) {
                  return {
                    teamCode: t.teamCode,
                    teamName: t.teamName,
                    problemStatement: t.appliedFor?.title || "N/A",
                    memberCount: t.memberCount,
                    status: t.teamStatus,
                    memberRSVPs: detailData.data.memberRSVPs || [],
                    teamMembers: detailData.data.teamMembers || [],
                  };
                }
              }
            } catch (error) {
              console.error(`Error fetching details for team ${t.teamCode}:`, error);
            }
            return {
              teamCode: t.teamCode,
              teamName: t.teamName,
              problemStatement: t.appliedFor?.title || "N/A",
              memberCount: t.memberCount,
              status: t.teamStatus,
              memberRSVPs: [],
              teamMembers: [],
            } as SelectedTeam;
          })
        );
        
        setSelectedTeams(teamsWithDetails);
        setSelectedTeamsTotalPages(data.data.pagination.totalPages);
      } else {
        setAlert({ type: "error", message: "Failed to fetch selected teams" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Error fetching selected teams" });
    } finally {
      setIsSelectedTeamsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'selected-teams') {
      const timeoutId = setTimeout(() => {
        fetchSelectedTeams();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedTeamsPage, selectedTeamsSearch, activeTab, getToken]);

  const toggleTeamExpansion = (teamCode: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamCode)) {
        newSet.delete(teamCode);
      } else {
        newSet.add(teamCode);
      }
      return newSet;
    });
  };

  const handleExport = async (type: 'users' | 'teams' | 'submissions') => {
    try {
      const token = await getToken();
      if (!token) return;

      const queryParams = type === 'submissions' ? '?isSubmitted=true' : '';

      const response = await fetch(`${API_ENDPOINTS.adminExport}${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith-${type}-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setAlert({
          type: "success",
          message: `Exported ${type} data successfully!`,
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: `Failed to export ${type} data`,
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleShortlistTeam = async (teamCode: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.adminUpdateTeam(teamCode), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamStatus: 'shortlisted',
          isShortlisted: true,
        }),
      });

      if (response.ok) {
        setTeams(prev =>
          prev.map(team =>
            team.teamCode === teamCode
              ? { ...team, status: 'shortlisted' }
              : team
          )
        );
        if (activeTab === 'selected-teams') {
          fetchSelectedTeams();
        }

        setAlert({
          type: "success",
          message: "Team shortlisted successfully!",
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: "Failed to shortlist team",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleViewTeam = async (teamCode: string) => {
    setIsViewModalOpen(true);
    setIsViewLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.adminTeamDetails(teamCode), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedTeam(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch team details");
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    setIsUserModalOpen(true);
    setIsUserLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setSelectedUser(data.user);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user details");
      setAlert({ type: "error", message: "Failed to fetch user details" });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsUserLoading(false);
    }
  };

  const handleAddProblemStatement = async () => {
    if (!newPsTitle.trim() || !newPsDescription.trim()) {
      setAlert({ type: "error", message: "Please fill in all fields" });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    setIsAddingPs(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.adminProblemStatements, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newPsTitle,
          description: newPsDescription,
        }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Problem statement added successfully' });
        setTimeout(() => setAlert(null), 3000);
        setIsAddPSModalOpen(false);
        setNewPsTitle("");
        setNewPsDescription("");
      } else {
        setAlert({ type: "error", message: "Failed to create problem statement" });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      setAlert({ type: "error", message: "An error occurred" });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsAddingPs(false);
    }
  };

  const renderPagination = (currentPage: number, totalPages: number, setPage: (page: number) => void) => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages)
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => setPage(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </React.Fragment>
            ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
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

      <FormSection title="Platform Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
          <Card>
            <div className="flex flex-col items-center gap-[8px] text-center">
              <UserCircle className="w-8 h-8 text-[#ff4d00]" />
              <span className="font-['Inter',sans-serif] text-[24px] text-white">{stats.totalUsers}</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-90">Total Users</span>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col items-center gap-[8px] text-center">
              <Users className="w-8 h-8 text-[#ff4d00]" />
              <span className="font-['Inter',sans-serif] text-[24px] text-white">{stats.totalTeams}</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-90">Total Teams</span>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col items-center gap-[8px] text-center">
              <FileText className="w-8 h-8 text-[#ff4d00]" />
              <span className="font-['Inter',sans-serif] text-[24px] text-white">{stats.totalSubmissions}</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-90">Submissions</span>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col items-center gap-[8px] text-center">
              <CheckCircle className="w-8 h-8 text-[#ff4d00]" />
              <span className="font-['Inter',sans-serif] text-[24px] text-white">{stats.totalEvaluated}</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-90">Evaluated</span>
            </div>
          </Card>
        </div>
      </FormSection>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 h-auto">
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="teams">Manage Teams</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="selected-teams">Selected Teams</TabsTrigger>
          <TabsTrigger value="evaluators">Evaluators</TabsTrigger>
          <TabsTrigger value="problems">Problem Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <FormSection title="Users">
            <div className="flex flex-col gap-[12px] mb-6">
              <div className="flex flex-col sm:flex-row gap-[12px]">
                <div className="flex-1">
                  <FormInput
                    label=""
                    placeholder="Search users by name or email..."
                    value={usersSearch}
                    onChange={(e) => {
                      setUsersSearch(e.target.value);
                      setUsersPage(1);
                    }}
                  />
                </div>
                <Button variant="secondary" onClick={() => handleExport('users')}>
                  <Download className="w-4 h-4" />
                  Export Users
                </Button>
              </div>
            </div>

            {isUsersLoading ? (
              <div className="flex justify-center py-[40px]">
                <Spinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-white text-center py-[40px] opacity-70">
                No users found.
              </div>
            ) : (
              <div className="flex flex-col gap-[12px]">
                {users.map((user) => (
                  <Card key={user.id}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0">
                          <UserCircle className="w-6 h-6 text-white opacity-90" />
                        </div>
                        <div>
                          <h3 className="font-['Inter',sans-serif] text-[16px] text-white">{user.name}</h3>
                          <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-90 break-all">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pl-[56px] sm:pl-0 w-full sm:w-auto justify-between sm:justify-end">
                        {user.teamName && (
                          <div className="bg-[rgba(255,255,255,0.05)] px-3 py-1 rounded-full">
                            <span className="text-[12px] text-white opacity-90">Team: {user.teamName}</span>
                          </div>
                        )}
                        <Button variant="secondary" onClick={() => handleViewUser(user.uid)}>
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {renderPagination(usersPage, usersTotalPages, setUsersPage)}
              </div>
            )}
          </FormSection>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <FormSection title="Submissions">
            <div className="flex flex-col gap-[12px] mb-6">
              <div className="flex flex-col sm:flex-row gap-[12px]">
                <div className="flex-1">
                  <FormInput
                    label=""
                    placeholder="Search submissions..."
                    value={submissionsSearch}
                    onChange={(e) => {
                      setSubmissionsSearch(e.target.value);
                      setSubmissionsPage(1);
                    }}
                  />
                </div>
                {/* <Button variant="secondary" onClick={() => handleExport('submissions')}>
                  <Download className="w-4 h-4" />
                  Export Submissions
                </Button> */}
              </div>
            </div>

            {isSubmissionsLoading ? (
              <div className="flex justify-center py-[40px]">
                <Spinner size="lg" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-white text-center py-[40px] opacity-70">
                No submissions found.
              </div>
            ) : (
              <div className="flex flex-col gap-[16px]">
                {submissions.map((team) => (
                  <Card key={team.teamCode}>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-['Inter',sans-serif] text-[16px] text-white mb-[4px]">{team.teamName}</h3>
                        <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-90 mb-[8px]">
                          Problem: {team.problemStatement} • Status: {team.status}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {team.videoURL && (
                            <a
                              href={team.videoURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[12px] hover:bg-red-500/20 transition-colors border border-red-500/20"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                              Video Pitch
                            </a>
                          )}
                          {team.submissionPDF && (
                            <a
                              href={team.submissionPDF}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[12px] hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                            >
                              <FileText className="w-3 h-3" />
                              Documentation
                            </a>
                          )}
                          {team.anyOtherLink && (
                            <a
                              href={team.anyOtherLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[12px] hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                              Project Link
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-[8px] w-full sm:w-auto justify-end">
                        <Button variant="secondary" onClick={() => handleViewTeam(team.teamCode)}>
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {renderPagination(submissionsPage, submissionsTotalPages, setSubmissionsPage)}
              </div>
            )}
          </FormSection>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <FormSection title="Teams">
            <div className="flex flex-col gap-[12px] mb-6">
              <div className="flex flex-col sm:flex-row gap-[12px]">
                <div className="flex-1">
                  <FormInput
                    label=""
                    placeholder="Search teams..."
                    value={teamsSearch}
                    onChange={(e) => {
                      setTeamsSearch(e.target.value);
                      setTeamsPage(1);
                    }}
                  />
                </div>
                <Button variant="secondary" onClick={() => handleExport('teams')}>
                  <Download className="w-4 h-4" />
                  Export Teams
                </Button>
              </div>
            </div>

            {isTeamsLoading ? (
              <div className="flex justify-center py-[40px]">
                <Spinner size="lg" />
              </div>
            ) : teams.length === 0 ? (
              <div className="text-white text-center py-[40px] opacity-70">
                No teams found.
              </div>
            ) : (
              <div className="flex flex-col gap-[16px]">
                {teams.map((team) => (
                  <Card key={team.teamCode}>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-['Inter',sans-serif] text-[16px] text-white mb-[4px]">{team.teamName}</h3>
                        <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-90 mb-[8px]">
                          Problem: {team.problemStatement} • Members: {team.memberCount} • Status: {team.status}
                        </p>
                      </div>
                      <div className="flex gap-[8px] w-full sm:w-auto justify-end">
                        <Button variant="secondary" onClick={() => handleViewTeam(team.teamCode)}>
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        {team.status === 'submitted' || team.status === 'under-review' ? (
                          <Button variant="primary" onClick={() => {
                            setConfirmation({
                              isOpen: true,
                              title: "Shortlist Team",
                              message: `Are you sure you want to shortlist team "${team.teamName}"? This will move them to the next round.`,
                              onConfirm: () => handleShortlistTeam(team.teamCode),
                            });
                          }}>
                            <Star className="w-4 h-4" />
                            Shortlist
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))}
                {renderPagination(teamsPage, teamsTotalPages, setTeamsPage)}
              </div>
            )}
          </FormSection>
        </TabsContent>
        <TabsContent value="selected-teams" className="mt-6">
          <FormSection title="Selected Teams">
            <div className="flex flex-col gap-[12px] mb-6">
              <div className="flex flex-col sm:flex-row gap-[12px]">
                <div className="flex-1">
                  <FormInput
                    label=""
                    placeholder="Search selected teams..."
                    value={selectedTeamsSearch}
                    onChange={(e) => {
                      setSelectedTeamsSearch(e.target.value);
                      setSelectedTeamsPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
            {isSelectedTeamsLoading ? (
              <div className="flex justify-center py-[40px]">
                <Spinner size="lg" />
              </div>
            ) : selectedTeams.length === 0 ? (
              <div className="text-white text-center py-[40px] opacity-70">
                No selected teams found.
              </div>
            ) : (
              <div className="flex flex-col gap-[16px]">
                {selectedTeams.map((team) => {
                  const isExpanded = expandedTeams.has(team.teamCode);
                  const memberRSVPsMap = new Map(
                    (team.memberRSVPs || []).map((rsvp: any) => [rsvp.uid, rsvp])
                  );
        
                  return (
                    <Card key={team.teamCode}>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-['Inter',sans-serif] text-[16px] text-white mb-[4px]">
                              {team.teamName}
                            </h3>
                            <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-90 mb-[8px]">
                              Problem: {team.problemStatement} • Members: {team.memberCount} • Status: {team.status}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[12px] text-white opacity-70">
                                RSVP Status:
                              </span>
                              <span className="text-[12px] font-semibold text-white">
                                {team.memberRSVPs?.length || 0} / {team.memberCount} responded
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-[8px] w-full sm:w-auto justify-end">
                            <Button
                              variant="secondary"
                              onClick={() => toggleTeamExpansion(team.teamCode)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Hide Members
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show Members
                                </>
                              )}
                            </Button>
                            <Button variant="secondary" onClick={() => handleViewTeam(team.teamCode)}>
                              <Eye className="w-4 h-4" />
                              View Details
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Members List */}
                        {isExpanded && team.teamMembers && team.teamMembers.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                            <h4 className="text-[14px] text-white font-semibold mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                              Team Members
                            </h4>
                            <div className="flex flex-col gap-3">
                              {team.teamMembers.map((member) => {
                                const rsvp = memberRSVPsMap.get(member.uid);
                                const rsvpStatus = rsvp?.rsvpStatus || null;
                                
                                return (
                                  <div
                                    key={member.uid}
                                    className="flex items-center justify-between p-3 bg-[rgba(138,138,138,0.05)] rounded-[12px] border border-[rgba(255,255,255,0.1)]"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0">
                                        <UserCircle className="w-6 h-6 text-white opacity-90" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-['Inter',sans-serif] text-[14px] text-white">
                                          {member.name}
                                          {member.role === 'Team Lead' && (
                                            <span className="ml-2 text-[12px] text-[#ff4d00]">(Lead)</span>
                                          )}
                                        </h5>
                                        {member.email && (
                                          <p className="font-['Inter',sans-serif] text-[12px] text-white opacity-70 break-all">
                                            {member.email}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {rsvpStatus === 'confirmed' ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                                          <Check className="w-3.5 h-3.5 text-green-400" />
                                          <span className="text-[12px] text-green-400 font-medium">Confirmed</span>
                                        </div>
                                      ) : rsvpStatus === 'declined' ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                                          <X className="w-3.5 h-3.5 text-red-400" />
                                          <span className="text-[12px] text-red-400 font-medium">Declined</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                          <Clock className="w-3.5 h-3.5 text-yellow-400" />
                                          <span className="text-[12px] text-yellow-400 font-medium">Pending</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {renderPagination(selectedTeamsPage, selectedTeamsTotalPages, setSelectedTeamsPage)}
              </div>
            )}
          </FormSection>
        </TabsContent>

        <TabsContent value="evaluators" className="mt-6">
          <EvaluatorsTab />
        </TabsContent>

        <TabsContent value="problems" className="mt-6">
          <FormSection title="Manage Problem Statements">
            <Button variant="primary" onClick={() => setIsAddPSModalOpen(true)}>
              <Upload className="w-4 h-4" />
              Add New Problem Statement
            </Button>
          </FormSection>
        </TabsContent>
      </Tabs>

      <TeamDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        teamDetails={selectedTeam}
        isLoading={isViewLoading}
        error={null}
        onMemberClick={(memberId) => handleViewUser(memberId)}
      />

      <UserProfileModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userDetails={selectedUser}
        isLoading={isUserLoading}
        openResumeInNewTab
      />

      <Modal isOpen={isAddPSModalOpen} onClose={() => setIsAddPSModalOpen(false)} title="Add Problem Statement">
        <div className="flex flex-col gap-[20px]">
          <FormInput
            label="Title"
            placeholder="Enter problem statement title"
            value={newPsTitle}
            onChange={(e) => setNewPsTitle(e.target.value)}
          />

          <FormTextarea
            label="Description"
            placeholder="Enter detailed description..."
            value={newPsDescription}
            onChange={(e) => setNewPsDescription(e.target.value)}
          />

          <div className="flex gap-[12px] justify-end pt-[8px]">
            <Button onClick={() => setIsAddPSModalOpen(false)} variant="secondary" disabled={isAddingPs}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmation({
                  isOpen: true,
                  title: "Create Problem Statement",
                  message: "Are you sure you want to create this problem statement? It will be visible to all users.",
                  onConfirm: handleAddProblemStatement,
                });
              }}
              variant="primary"
              disabled={isAddingPs || !newPsTitle || !newPsDescription}
            >
              {isAddingPs && <Spinner size="sm" className="mr-2" />}
              {isAddingPs ? 'Creating...' : 'Create Problem Statement'}
            </Button>
          </div>
        </div>
      </Modal>

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
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
      />
    </div>
  );
}

