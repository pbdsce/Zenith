"use client";

import { AnalyticsDashboard } from "@/components/registration/analytics-dashboard";
import { RoleGuard } from "@/components/auth/role-guard";

export default function FraiPage() {
    return (
        <RoleGuard allowedRoles={['frai']}>
            <AnalyticsDashboard />
        </RoleGuard>
    );
}
