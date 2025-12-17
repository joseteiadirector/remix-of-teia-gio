import { useState } from "react";
import { Outlet, NavLink, useLocation, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const adminNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Marcas", url: "/admin/brands", icon: Building2 },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Server-side admin role verification
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ['admin-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('verify_admin_role');
      if (error) {
        console.error('Admin verification failed:', error);
        return false;
      }
      return data === true;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking admin status
  if (isCheckingAdmin) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(collapsed && "mx-auto")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-2">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.url || 
              (item.url !== '/admin' && location.pathname.startsWith(item.url));
            
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Back to App */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <NavLink to="/dashboard">
            <Button 
              variant="outline" 
              className={cn("w-full", collapsed && "px-2")}
            >
              <ArrowLeft className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Voltar ao App</span>}
            </Button>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
