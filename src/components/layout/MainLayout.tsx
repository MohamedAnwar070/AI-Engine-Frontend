import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const showSidebar = location.pathname !== "/login" && !isLoading && isAuthenticated;

  return (
    <div className="relative min-h-screen midnight-mesh selection:bg-primary/30">
      {showSidebar ? <Sidebar /> : null}
      <main className={showSidebar ? "ml-20 transition-all duration-300 min-h-screen" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
}
