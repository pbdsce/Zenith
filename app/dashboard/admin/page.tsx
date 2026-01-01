"use client";

import { AdminContainer } from "@/components/registration/admin-container";
import { RoleGuard } from "@/components/auth/role-guard";

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminContainer />
    </RoleGuard>
  );
}

