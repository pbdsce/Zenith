"use client";

import { FraiContainer } from "@/components/registration/frai-container";
import { RoleGuard } from "@/components/auth/role-guard";

export default function FraiPage() {
    return (
        <RoleGuard allowedRoles={['frai']}>
            <FraiContainer />
        </RoleGuard>
    );
}
