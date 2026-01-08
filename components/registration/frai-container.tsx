import React, { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-auth';
import { UserCircle, Users, FileText, CheckCircle } from "lucide-react";
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

const REGISTRATION_DATA = [
    { name: 'Jan 1', users: 45 },
    { name: 'Jan 2', users: 98 },
    { name: 'Jan 3', users: 156 },
    { name: 'Jan 4', users: 180 },
    { name: 'Jan 5', users: 202 },
    { name: 'Jan 6', users: 243 },
    { name: 'Jan 7', users: 301 },
    { name: 'Jan 8', users: 378 },
];

const TEAM_STATUS_DATA = [
    { name: 'Registered', value: 91 },
    { name: 'Submitted', value: 4 },
    { name: 'Evaluated', value: 1 },
    { name: 'Shortlisted', value: 0 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SUBMISSION_ACTIVITY = [
    { time: '10:00', submissions: 0 },
    { time: '11:00', submissions: 1 },
    { time: '12:00', submissions: 0 },
    { time: '13:00', submissions: 2 },
    { time: '14:00', submissions: 0 },
    { time: '15:00', submissions: 1 },
    { time: '16:00', submissions: 0 },
];


import { API_ENDPOINTS } from "@/lib/api-config";

export function FraiContainer() {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState("analytics");

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

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const response = await fetch('/api/frai-data', {
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
                    }
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };

        fetchStats();
    }, [getToken]);

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
                <TabsList className="grid w-full grid-cols-1 h-auto">
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                                        <LineChart data={REGISTRATION_DATA}>
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
                                                data={TEAM_STATUS_DATA}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {TEAM_STATUS_DATA.map((entry, index) => (
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
                                        <BarChart data={SUBMISSION_ACTIVITY}>
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
                        </div>
                    </FormSection>
                </TabsContent>
            </Tabs>
        </div>
    );
}
