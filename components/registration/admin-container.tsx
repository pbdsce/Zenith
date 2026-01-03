import React, { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { UserCircle, Users, FileText, CheckCircle, Search, Download, Eye, Star, Upload } from "lucide-react";
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
            totalEvaluated: teamsData.data?.stats?.shortlisted || 0,
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

  const handleExport = async (type: 'users' | 'teams') => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.adminExport, {
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
        <div className="grid grid-cols-4 gap-[16px]">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="teams">Manage Teams</TabsTrigger>
          <TabsTrigger value="evaluators">Evaluators</TabsTrigger>
          <TabsTrigger value="problems">Problem Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <FormSection title="Users">
            <div className="flex flex-col gap-[12px] mb-6">
              <div className="flex gap-[12px]">
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-white opacity-90" />
                        </div>
                        <div>
                          <h3 className="font-['Inter',sans-serif] text-[16px] text-white">{user.name}</h3>
                          <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-90">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
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

        <TabsContent value="teams" className="mt-6">
          <FormSection title="Teams">
            <div className="flex flex-col gap-[12px] mb-6">
              <div className="flex gap-[12px]">
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-['Inter',sans-serif] text-[16px] text-white mb-[4px]">{team.teamName}</h3>
                        <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-90 mb-[8px]">
                          Problem: {team.problemStatement} • Members: {team.memberCount} • Status: {team.status}
                        </p>
                      </div>
                      <div className="flex gap-[8px]">
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

