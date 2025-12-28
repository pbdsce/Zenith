import { useAuthContext } from "@/components/providers/auth-provider";

export const useAuth = () => {
    const context = useAuthContext();
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    // Map to legacy interface
    return {
        ...context,
        isAuthenticated: !!context.user,
        isLoading: context.loading,
    };
};
