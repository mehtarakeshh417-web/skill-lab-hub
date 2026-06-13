import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, ROLE_HOME, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  School2,
  Users,
  ShieldCheck,
  BookOpen,
  ClipboardList,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; to: string; icon: typeof LayoutDashboard };

const NAV: Record<AppRole, NavItem[]> = {
  admin: [
    { label: "Overview", to: "/admin", icon: LayoutDashboard },
    { label: "Schools", to: "/admin", icon: School2 },
    { label: "Users", to: "/admin", icon: Users },
    { label: "Analytics", to: "/admin", icon: BarChart3 },
  ],
  portal_manager: [
    { label: "Operations", to: "/manager", icon: LayoutDashboard },
    { label: "Schools", to: "/manager", icon: School2 },
    { label: "Teachers", to: "/manager", icon: GraduationCap },
    { label: "Students", to: "/manager", icon: Users },
  ],
  school: [{ label: "Dashboard", to: "/school", icon: LayoutDashboard }],
  teacher: [{ label: "Dashboard", to: "/teacher", icon: LayoutDashboard }],
  student: [
    { label: "My Lab", to: "/student", icon: LayoutDashboard },
    { label: "Practice", to: "/student", icon: BookOpen },
    { label: "Assignments", to: "/student", icon: ClipboardList },
  ],
};

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  portal_manager: "Portal Manager",
  school: "School",
  teacher: "Teacher",
  student: "Student",
};

const ROLE_ICON: Record<AppRole, typeof ShieldCheck> = {
  admin: ShieldCheck,
  portal_manager: Users,
  school: School2,
  teacher: GraduationCap,
  student: BookOpen,
};

export function AppShell({
  children,
  requireRole,
  title,
}: {
  children: ReactNode;
  requireRole?: AppRole;
  title?: string;
}) {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
    } else if (requireRole && role && role !== requireRole) {
      navigate({ to: ROLE_HOME[role], replace: true });
    }
  }, [user, role, loading, requireRole, navigate]);

  if (loading || !user || !role || (requireRole && role !== requireRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const nav = NAV[role];
  const RoleIcon = ROLE_ICON[role];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border/60 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="font-display text-base font-bold">Avartan Lab</div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent">
              <RoleIcon className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-medium">{user.user_metadata?.full_name ?? user.email}</div>
              <div className="truncate text-xs text-sidebar-foreground/60">{ROLE_LABEL[role]}</div>
            </div>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl lg:px-10">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {ROLE_LABEL[role]} Console
            </div>
            <h1 className="font-display text-lg font-semibold tracking-tight">{title ?? "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-3 lg:hidden">
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}