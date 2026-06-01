
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { apiMe, clearToken } from "./lib/auth";
import type { User } from "./lib/auth";

const queryClient = new QueryClient();

function AuthGuard({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    apiMe().then((u) => setUser(u ?? null));
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogin = (loggedUser: User) => setUser(loggedUser);
  const handleLogout = () => { clearToken(); setUser(null); };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
            />
            <Route
              path="/"
              element={
                <AuthGuard user={user}>
                  <Index user={user!} onLogout={handleLogout} />
                </AuthGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;