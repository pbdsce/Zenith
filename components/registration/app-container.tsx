"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/use-auth';
import { NavBar } from "./navbar";
import { DotPattern } from "./dot-pattern";
import { AlertBanner } from "./alert-banner";
import { StickyAlert } from "./sticky-alert";
import { RegistrationContainer } from "./registration-container";
import { DashboardContainer } from "./dashboard-container";
import { ProfileContainer } from "./profile-container";
import { TeamContainer } from "./team-container";
import { SubmissionContainer } from "./submission-container";
import { LandingContainer } from "./landing-container";
import { ProblemStatementsContainer } from "./problem-statements-container";
import { DiscoverContainer } from "./discover-container";
import { EvaluatorContainer } from "./evaluator-container";
import { AdminContainer } from "./admin-container";

type View = "landing" | "login" | "register" | "problem-statements" | "dashboard" | "profile" | "team" | "submission" | "discover" | "evaluator" | "admin";

export function AppContainer() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>("landing");
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      // User is authenticated, show dashboard based on role
      if (user.role === 'admin') {
        setCurrentView("admin");
      } else if (user.role === 'evaluator') {
        setCurrentView("evaluator");
      } else {
        setCurrentView("dashboard");
      }
    } else if (!isAuthenticated && !user) {
      // User is not authenticated, show landing page
      setCurrentView("landing");
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleNavigate = (view: string) => {
    // Handle navigation based on view
    if (view === 'login') {
      router.push('/login');
    } else if (view === 'register') {
      router.push('/register');
    } else if (view.startsWith('team?joinCode=')) {
      // Extract join code from query string
      const joinCode = view.split('joinCode=')[1];
      setCurrentView("team");
      // You might want to pass this to TeamContainer via props or state
    } else {
      setCurrentView(view as View);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    setAlert({
      type: "info",
      message: "Logged out successfully",
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleRegistrationSuccess = () => {
    setCurrentView("dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#171717]">
        <div className="text-white" style={{ fontFamily: 'var(--font-body)' }}>Loading...</div>
      </div>
    );
  }

  // Show landing/login/register pages if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-start relative"
        style={{
          backgroundImage: "linear-gradient(90deg, rgb(23, 23, 23) 0%, rgb(23, 23, 23) 100%)",
        }}
      >
        <NavBar 
          user={undefined} 
          onLogout={() => {}}
          onNavigate={handleNavigate}
        />

        <div className="bg-[#171717] w-full relative flex-1">
          <div
            className="flex flex-col items-center justify-center w-full min-h-screen pb-[80px] pt-[60px] px-[40px] relative"
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

              {currentView === "landing" && (
                <LandingContainer onNavigate={handleNavigate} />
              )}

              {currentView === "problem-statements" && (
                <ProblemStatementsContainer onNavigate={handleNavigate} />
              )}
            </div>
          </div>

          <DotPattern />
        </div>
      </div>
    );
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
        onNavigate={handleNavigate}
      />

      <div className="bg-[#171717] w-full relative flex-1">
        <div
          className="flex flex-col items-center justify-center w-full min-h-screen pb-[80px] pt-[60px] px-[40px] relative"
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

            {currentView === "dashboard" && (
              <DashboardContainer onNavigate={handleNavigate} />
            )}

            {currentView === "profile" && (
              <ProfileContainer onNavigate={handleNavigate} />
            )}

            {currentView === "team" && (
              <TeamContainer onNavigate={handleNavigate} />
            )}

            {currentView === "submission" && (
              <SubmissionContainer onNavigate={handleNavigate} />
            )}

            {currentView === "discover" && (
              <DiscoverContainer onNavigate={handleNavigate} />
            )}

            {currentView === "evaluator" && (
              <EvaluatorContainer />
            )}

            {currentView === "admin" && (
              <AdminContainer />
            )}
          </div>
        </div>

        <DotPattern />
      </div>
    </div>
  );
}

