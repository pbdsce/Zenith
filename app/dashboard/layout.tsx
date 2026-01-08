"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { NavBar } from "@/components/registration/navbar";
import { DotPattern } from "@/components/registration/dot-pattern";
import { StickyAlert } from "@/components/registration/sticky-alert";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !hasRefreshed) {
      refreshUser().then(() => {
        setHasRefreshed(true);
      }).catch((error) => {
        console.error("Error refreshing user:", error);
        setHasRefreshed(true);
      });
    }
  }, [isLoading, isAuthenticated, user, hasRefreshed, refreshUser]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Redirect based on role only if on base dashboard route
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      if (user.role === 'admin') {
        router.push("/dashboard/admin");
      } else if (user.role === 'evaluator') {
        router.push("/dashboard/evaluator");
      }
    }
  }, [isAuthenticated, user, isLoading, router, pathname]);

  const handleLogout = async () => {
    await logout();
    // router.push("/login"); // logout() already handles redirect, but keeping this as backup is fine if we await
    setAlert({
      type: "info",
      message: "Logged out successfully",
    });
    setTimeout(() => setAlert(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#171717]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-start relative"
      style={{
        backgroundImage: "linear-gradient(90deg, rgb(23, 23, 23) 0%, rgb(23, 23, 23) 100%)",
      }}
    >
      <NavBar 
        user={user && user.name ? { uid: user.uid, name: user.name, email: user.email, role: user.role } : undefined} 
        onLogout={handleLogout}
        onNavigate={(view) => {
          if (view === 'login') {
            router.push('/login');
          } else if (view === 'register') {
            router.push('/register');
          } else if (view === 'landing') {
            router.push('/');
          } else if (view.startsWith('team?joinCode=')) {
            const joinCode = view.split('joinCode=')[1];
            router.push(`/dashboard/team?joinCode=${joinCode}`);
          } else if (view === 'problem-statements') {
            router.push('/problem-statements');
          } else {
            router.push(`/dashboard/${view}`);
          }
        }}
      />

      <div className="bg-[#171717] w-full relative flex-1">
        <div
          className="flex flex-col items-center justify-center w-full min-h-screen pb-10 pt-10 px-4 md:pb-[80px] md:pt-[60px] md:px-[40px] relative"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 652\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(31.68 0 0 22.168 0 174.74)\\'><stop stop-color=\\'rgba(62,32,19,1)\\' offset=\\'0.10445\\'/><stop stop-color=\\'rgba(62,32,19,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
          }}
        >
          <div className="max-w-[1000px] w-full z-10 flex flex-col gap-[32px] items-center">
            {alert && (
              <StickyAlert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}

            {children}
          </div>
        </div>

        <DotPattern />
      </div>
    </div>
  );
}

