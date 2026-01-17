"use client";

import { EvaluatorContainer } from "@/components/registration/evaluator-container";
import { RoleGuard } from "@/components/auth/role-guard";

export default function EvaluatorPage() {
  return (
    <RoleGuard allowedRoles={['evaluator']}>
      <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
        <EvaluatorContainer />
      </div>
    </RoleGuard>
  );
}

