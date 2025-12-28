"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from "@/lib/api-config";
import { UserCircle, Users, FileText, CheckCircle, Search, Download, Eye, Star, Upload, Shield } from "lucide-react";
import { FormSection } from "./form-section";
import { FormInput } from "./form-input";
import { Button } from "./button";
import { Card } from "./card";
import { StickyAlert } from "./sticky-alert";

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

export function AdminContainer() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTeams: 0,
    totalSubmissions: 0,
    totalEvaluated: 0,
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch participants
        const participantsResponse = await fetch(API_ENDPOINTS.adminParticipants, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Fetch teams
        const teamsResponse = await fetch(API_ENDPOINTS.adminTeams, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          if (participantsData.success && participantsData.data) {
            setStats(prev => ({
              ...prev,
              totalUsers: participantsData.data.length || 0,
            }));
          }
        }

        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          if (teamsData.success && teamsData.data) {
            const teamsList = teamsData.data;
            setStats(prev => ({
              ...prev,
              totalTeams: teamsList.length || 0,
              totalSubmissions: teamsList.filter((t: Team) => t.status === 'submitted' || t.status === 'under-review' || t.status === 'shortlisted').length || 0,
              totalEvaluated: teamsList.filter((t: Team) => t.status === 'shortlisted' || t.status === 'confirmed').length || 0,
            }));
            setTeams(teamsList);
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [getToken]);

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
          status: 'shortlisted',
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

  const filteredTeams = teams.filter(team =>
    team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.teamCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-70">Total Users</span>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col items-center gap-[8px] text-center">
              <Users className="w-8 h-8 text-[#ff4d00]" />
              <span className="font-['Inter',sans-serif] text-[24px] text-white">{stats.totalTeams}</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-70">Total Teams</span>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col items-center gap-[8px] text-center">
              <FileText className="w-8 h-8 text-[#ff4d00]" />
              <span className="font-['Inter',sans-serif] text-[24px] text-white">{stats.totalSubmissions}</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-70">Submissions</span>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col items-center gap-[8px] text-center">
              <CheckCircle className="w-8 h-8 text-[#ff4d00]" />
              <span className="font-['Inter',sans-serif] text-[24px] text-white">{stats.totalEvaluated}</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-70">Evaluated</span>
            </div>
          </Card>
        </div>
      </FormSection>

      <FormSection title="Manage Users">
        <div className="flex flex-col gap-[12px]">
          <div className="flex gap-[12px]">
            <div className="flex-1">
              <FormInput
                label=""
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="secondary">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
          <div className="flex gap-[12px]">
            <Button variant="secondary" onClick={() => handleExport('users')}>
              <Download className="w-4 h-4" />
              Export Users (CSV)
            </Button>
            <Button variant="secondary" onClick={() => handleExport('teams')}>
              <Download className="w-4 h-4" />
              Export Teams (CSV)
            </Button>
          </div>
        </div>
      </FormSection>

      <FormSection title="Manage Teams">
        {isLoading ? (
          <div className="text-white text-center py-[40px]">Loading teams...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-white text-center py-[40px] opacity-70">
            No teams found.
          </div>
        ) : (
          <div className="flex flex-col gap-[16px]">
            {filteredTeams.map((team) => (
              <Card key={team.teamCode}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-['Inter',sans-serif] text-[16px] text-white mb-[4px]">{team.teamName}</h3>
                    <p className="font-['Inter',sans-serif] text-[13px] text-white opacity-70 mb-[8px]">
                      Problem: {team.problemStatement} • Members: {team.memberCount} • Status: {team.status}
                    </p>
                  </div>
                  <div className="flex gap-[8px]">
                    <Button variant="secondary">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    {team.status === 'submitted' || team.status === 'under-review' ? (
                      <Button variant="primary" onClick={() => handleShortlistTeam(team.teamCode)}>
                        <Star className="w-4 h-4" />
                        Shortlist
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title="Manage Problem Statements">
        <Button variant="primary">
          <Upload className="w-4 h-4" />
          Add New Problem Statement
        </Button>
      </FormSection>
    </div>
  );
}

