"use client";

import { EvaluatorContainer } from "@/components/registration/evaluator-container";
import { RoleGuard } from "@/components/auth/role-guard";

export default function EvaluatorPage() {
  return (
    <RoleGuard allowedRoles={['evaluator']}>
      <EvaluatorContainer />
    </RoleGuard>
  );
}

