import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/lib/auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectForm from "./pages/ProjectForm";
import ProjectDetail from "./pages/ProjectDetail";
import NodeForm from "./pages/NodeForm";
import ChatPlayground from "./pages/ChatPlayground";
import LLMProviders from "./pages/LLMProviders";
import Operations from "./pages/Operations";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const THEME_STORAGE_KEY = "arffy_theme";
const FONT_SIZE_STORAGE_KEY = "arffy_font_size";

const App = () => {
  // Apply theme and font size from localStorage on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    const savedFontSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY) || "medium";

    // Apply theme
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (savedTheme === "auto" && prefersDark)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply font size
    const sizeMap: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.fontSize = sizeMap[savedFontSize] || "16px";

    console.log(`[Theme] Applied theme: ${savedTheme}, font size: ${savedFontSize}`);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/new" element={<ProtectedRoute permissions={["projects:write"]}><ProjectForm /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute permissions={["projects:read"]}><ProjectDetail /></ProtectedRoute>} />
                <Route path="/projects/:id/edit" element={<ProtectedRoute permissions={["projects:write"]}><ProjectForm /></ProtectedRoute>} />
                <Route path="/projects/:projectId/nodes/new" element={<ProtectedRoute permissions={["nodes:write"]}><NodeForm /></ProtectedRoute>} />
                <Route path="/projects/:projectId/nodes/:nodeId/edit" element={<ProtectedRoute permissions={["nodes:write"]}><NodeForm /></ProtectedRoute>} />
                <Route path="/projects/:id/chat" element={<ProtectedRoute permissions={["chat:use"]}><ChatPlayground /></ProtectedRoute>} />
                <Route path="/llm-providers" element={<ProtectedRoute permissions={["providers:read"]}><LLMProviders /></ProtectedRoute>} />
                <Route path="/operations" element={<ProtectedRoute permissions={["monitoring:read"]}><Operations /></ProtectedRoute>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/docs" element={<Documentation />} />
                <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
