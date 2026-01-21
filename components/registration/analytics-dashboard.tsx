import React, { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { UserCircle, Users, FileText, CheckCircle, Trophy, Search, Sparkles, ExternalLink } from "lucide-react";
import { FormSection } from "./form-section";
import { Card } from "./card";
import { StickyAlert } from "./sticky-alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AdminStats {
    totalUsers: number;
    totalTeams: number;
    totalSubmissions: number;
    totalEvaluated: number;
}

interface ShortlistedTeam {
    _id: string;
    teamCode: string;
    teamName: string;
    teamLead: string;
    appliedFor?: string;
    memberCount: number;
    submissionPdf?: string;
    videoUrl?: string;
    status: string;
    createdAt: string;
}

interface ShortlistedStats {
    totalTeams: number;
    totalParticipants: number;
    psDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
}



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];




import { API_ENDPOINTS } from "@/lib/api-config";

export function AnalyticsDashboard() {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState("analytics");

    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalTeams: 0,
        totalSubmissions: 0,
        totalEvaluated: 0,
    });

    const [registrationData, setRegistrationData] = useState<any[]>([]);
    const [teamStatusData, setTeamStatusData] = useState<any[]>([]);
    const [submissionData, setSubmissionData] = useState<any[]>([]);
    const [psDistributionData, setPsDistributionData] = useState<any[]>([]);

    // Shortlisted teams state
    const [shortlistedTeams, setShortlistedTeams] = useState<ShortlistedTeam[]>([]);
    const [shortlistedStats, setShortlistedStats] = useState<ShortlistedStats>({
        totalTeams: 0,
        totalParticipants: 0,
        psDistribution: {},
        statusDistribution: {},
    });
    const [shortlistedSearchQuery, setShortlistedSearchQuery] = useState('');
    const [shortlistedLoading, setShortlistedLoading] = useState(false);

    const [alert, setAlert] = useState<{
        type: "success" | "error" | "warning" | "info";
        message: string;
    } | null>(null);

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const response = await fetch('/api/analytics', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setStats({
                            totalUsers: result.data.totalUsers || 0,
                            totalTeams: result.data.totalTeams || 0,
                            totalSubmissions: result.data.totalSubmissions || 0,
                            totalEvaluated: result.data.totalEvaluated || 0,
                        });

                        if (result.data.history) {
                            const chartData = result.data.history.map((item: any) => {
                                const date = new Date(item.date);
                                return {
                                    name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                    users: item.totalUsers
                                };
                            });
                            setRegistrationData(chartData);
                        }

                        if (result.data.teamDistribution) {
                            setTeamStatusData(result.data.teamDistribution);
                        }

                        if (result.data.submissionActivity) {
                            setSubmissionData(result.data.submissionActivity);
                        }

                        if (result.data.psDistribution) {
                            setPsDistributionData(result.data.psDistribution);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };

        fetchStats();
    }, [getToken]);

    // Fetch Shortlisted Teams
    useEffect(() => {
        const fetchShortlistedTeams = async () => {
            try {
                setShortlistedLoading(true);
                const token = await getToken();
                if (!token) return;

                const response = await fetch('/api/shortlisted-teams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setShortlistedTeams(result.data.teams || []);
                        setShortlistedStats(result.data.stats || {
                            totalTeams: 0,
                            totalParticipants: 0,
                            psDistribution: {},
                            statusDistribution: {},
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch shortlisted teams", error);
            } finally {
                setShortlistedLoading(false);
            }
        };

        fetchShortlistedTeams();
    }, [getToken]);

    // Filter shortlisted teams based on search query
    const filteredShortlistedTeams = shortlistedTeams.filter(team =>
        team.teamName.toLowerCase().includes(shortlistedSearchQuery.toLowerCase()) ||
        team.teamCode.toLowerCase().includes(shortlistedSearchQuery.toLowerCase()) ||
        team.teamLead.toLowerCase().includes(shortlistedSearchQuery.toLowerCase())
    );

    // Generate initials from team name
    const getTeamInitials = (teamName: string) => {
        const words = teamName.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    return (
        <div className="flex flex-col text-white gap-[24px] w-full">
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full text-white">
                <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent border-b border-white/10 p-0">
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all pb-2">Analytics</TabsTrigger>
                    <TabsTrigger value="shortlisted" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all pb-2">Shortlisted Teams</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="mt-6">
                    <FormSection title="Analytics Dashboard">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                            <Card>
                                <div className="mb-4">
                                    <h3 className="text-white font-medium mb-1">Registration Growth</h3>
                                    <p className="text-white/60 text-sm">Daily new user registrations</p>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={registrationData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                            <YAxis stroke="rgba(255,255,255,0.5)" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Line type="monotone" dataKey="users" stroke="#ff4d00" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card>
                                <div className="mb-4">
                                    <h3 className="text-white font-medium mb-1">Team Status Distribution</h3>
                                    <p className="text-white/60 text-sm">Teams by current status</p>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={teamStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {teamStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Legend
                                                layout="vertical"
                                                verticalAlign="middle"
                                                align="right"
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card>
                                <div className="mb-4">
                                    <h3 className="text-white font-medium mb-1">Submission Activity</h3>
                                    <p className="text-white/60 text-sm">Submissions per hour (UTC)</p>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={submissionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                                            <YAxis stroke="rgba(255,255,255,0.5)" />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="submissions" fill="#ff4d00" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card>
                                <div className="mb-4">
                                    <h3 className="text-white font-medium mb-1">Submissions by Problem Statement</h3>
                                    <p className="text-white/60 text-sm">Distribution across problem statements</p>
                                </div>
                                <div className="h-[300px] w-full">
                                    {psDistributionData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={psDistributionData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                                    labelLine={true}
                                                >
                                                    {psDistributionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Legend
                                                    layout="vertical"
                                                    verticalAlign="middle"
                                                    align="right"
                                                    iconType="circle"
                                                    wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', maxWidth: '120px', lineHeight: '14px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-white/50">
                                            No submission data available
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </FormSection>
                </TabsContent>

                <TabsContent value="shortlisted" className="mt-6">
                    <FormSection title="Shortlisted Teams">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-6">
                            <Card>
                                <div className="flex flex-col items-center gap-[8px] text-center">
                                    <Trophy className="w-8 h-8 text-[#ff4d00]" />
                                    <span className="font-['Inter',sans-serif] text-[24px] text-white">{shortlistedStats.totalTeams}</span>
                                    <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-90">Teams Selected</span>
                                </div>
                            </Card>
                            <Card>
                                <div className="flex flex-col items-center gap-[8px] text-center">
                                    <Users className="w-8 h-8 text-[#ff4d00]" />
                                    <span className="font-['Inter',sans-serif] text-[24px] text-white">{shortlistedStats.totalParticipants}</span>
                                    <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-90">Total Participants</span>
                                </div>
                            </Card>
                            <Card>
                                <div className="flex flex-col items-center gap-[8px] text-center">
                                    <FileText className="w-8 h-8 text-[#ff4d00]" />
                                    <span className="font-['Inter',sans-serif] text-[24px] text-white">{Object.keys(shortlistedStats.psDistribution).length}</span>
                                    <span className="font-['Inter',sans-serif] text-[13px] text-white opacity-90">Problem Statements</span>
                                </div>
                            </Card>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative bg-[rgba(138,138,138,0.15)] border border-[rgba(255,255,255,0.2)] rounded-[15px] overflow-hidden max-w-md">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                    <Search className="w-5 h-5 text-white/50" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search teams by name, code, or leader..."
                                    value={shortlistedSearchQuery}
                                    onChange={(e) => setShortlistedSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/50 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Loading State */}
                        {shortlistedLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-white/60">Loading shortlisted teams...</div>
                            </div>
                        ) : (
                            <>
                                {/* Teams Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredShortlistedTeams.map((team, index) => {
                                        const initials = getTeamInitials(team.teamName);

                                        return (
                                            <div
                                                key={team._id || team.teamCode}
                                                className="group relative"
                                            >
                                                {/* Card */}
                                                <div
                                                    className="relative overflow-hidden rounded-[20px] p-[1px] transition-all duration-300 hover:-translate-y-2"
                                                    style={{
                                                        background: `linear-gradient(135deg, rgba(255, 77, 0, 0.4), transparent 50%, rgba(255, 77, 0, 0.4))`,
                                                    }}
                                                >
                                                    {/* Inner card */}
                                                    <div className="relative bg-[#1a1a1a] rounded-[19px] p-5 h-full overflow-hidden">
                                                        {/* Glow effect on hover */}
                                                        <div
                                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                            style={{
                                                                background: `radial-gradient(circle at 50% 0%, rgba(255, 77, 0, 0.3), transparent 70%)`,
                                                            }}
                                                        />

                                                        {/* Rank number */}
                                                        <div className="absolute top-3 right-3 text-[10px] text-white/20 font-mono">
                                                            #{String(index + 1).padStart(2, '0')}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="relative z-10 flex flex-col gap-4">
                                                            {/* Avatar/Initials */}
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 transition-transform duration-300 group-hover:scale-110"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, rgba(255, 77, 0, 0.15), rgba(255, 77, 0, 0.4))`,
                                                                        boxShadow: `0 4px 20px rgba(255, 77, 0, 0.3)`
                                                                    }}
                                                                >
                                                                    {initials}
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    {/* Team Name */}
                                                                    <h3
                                                                        className="text-white font-semibold text-base leading-tight truncate group-hover:text-white/90 transition-colors"
                                                                        title={team.teamName}
                                                                    >
                                                                        {team.teamName}
                                                                    </h3>

                                                                    {/* Leader Name */}
                                                                    <p
                                                                        className="text-xs text-white/50 mt-0.5 truncate"
                                                                        title={team.teamLead}
                                                                    >
                                                                        Led by {team.teamLead}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Problem Statement Badge */}
                                                            {team.appliedFor && (
                                                                <div className="flex">
                                                                    <span className="text-[10px] px-2 py-1 bg-[#ff4d00]/20 text-[#ff4d00] rounded-full border border-[#ff4d00]/30">
                                                                        {team.appliedFor}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Team Code & Member count row */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs text-white/40 font-mono">
                                                                    {team.teamCode}
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Users className="w-3.5 h-3.5 text-white/40" />
                                                                    <span className="text-xs text-white/60">
                                                                        {team.memberCount}
                                                                    </span>
                                                                </div>
                                                                {/* Finalist indicator */}
                                                                <div className="flex items-center gap-1 ml-auto">
                                                                    <Sparkles className="w-3.5 h-3.5 text-[#ff4d00]" />
                                                                    <span className="text-[10px] text-[#ff4d00] uppercase tracking-wider font-medium">
                                                                        Finalist
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Submission Links - Always visible buttons */}
                                                            <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                                                                {team.submissionPdf ? (
                                                                    <a
                                                                        href={team.submissionPdf}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 backdrop-blur-[2.5px] bg-[rgba(138,138,138,0.3)] hover:bg-[rgba(138,138,138,0.4)] border border-[rgba(255,255,255,0.38)] rounded-[12px] text-white text-xs font-medium transition-all"
                                                                    >
                                                                        <FileText className="w-3.5 h-3.5" />
                                                                        View PDF
                                                                    </a>
                                                                ) : (
                                                                    <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[rgba(138,138,138,0.2)] border border-[rgba(255,255,255,0.1)] rounded-[12px] text-[rgba(255,255,255,0.3)] text-xs cursor-not-allowed">
                                                                        <FileText className="w-3.5 h-3.5" />
                                                                        No PDF
                                                                    </div>
                                                                )}
                                                                {team.videoUrl ? (
                                                                    <a
                                                                        href={team.videoUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.95)] rounded-[12px] text-black text-xs font-medium transition-all"
                                                                    >
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                        View Video
                                                                    </a>
                                                                ) : (
                                                                    <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[rgba(138,138,138,0.2)] border border-[rgba(255,255,255,0.1)] rounded-[12px] text-[rgba(255,255,255,0.3)] text-xs cursor-not-allowed">
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                        No Video
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Decorative corner accent */}
                                                        <div
                                                            className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                                                            style={{ background: 'rgba(255, 77, 0, 0.4)' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* No results message */}
                                {filteredShortlistedTeams.length === 0 && !shortlistedLoading && (
                                    <div className="text-center py-12">
                                        <p className="text-white opacity-70 text-lg">
                                            {shortlistedSearchQuery
                                                ? `No teams found matching "${shortlistedSearchQuery}"`
                                                : "No shortlisted teams found"}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </FormSection>
                </TabsContent>
            </Tabs>
        </div>
    );
}
