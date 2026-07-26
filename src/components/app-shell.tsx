import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, ROLE_HOME, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import avartanLogo from "@/assets/avartan-logo.jpg.asset.json";
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
  KeyRound,
  ScrollText,
  UserCog,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/notifications-bell";
import { useServerFn } from "@tanstack/react-start";
import { getMySecurityStatus } from "@/lib/security.functions";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

type NavItem = { label: string; to: string; icon: typeof LayoutDashboard };

const NAV: Record<AppRole, NavItem[]> = {
  admin: [
    { label: "Overview", to: "/admin", icon: LayoutDashboard },
    { label: "Approvals", to: "/admin/pending-schools", icon: ClipboardList },
    { label: "Sales hierarchy", to: "/admin/sales-hierarchy", icon: BarChart3 },
    { label: "Users", to: "/admin/users", icon: UserCog },
    { label: "Audit Trail", to: "/admin/audit-logs", icon: ScrollText },
  ],
  portal_manager: [
    { label: "Operations", to: "/manager", icon: LayoutDashboard },
    { label: "Directory", to: "/manager/directory", icon: School2 },
    { label: "Approvals", to: "/manager/pending-schools", icon: ClipboardList },
    { label: "Users", to: "/manager/users", icon: UserCog },
    { label: "Audit Trail", to: "/manager/audit-logs", icon: ScrollText },
  ],
  sales_rep: [
    { label: "Dashboard", to: "/sales-rep", icon: LayoutDashboard },
    { label: "My Schools", to: "/sales-rep", icon: School2 },
  ],
  school: [{ label: "Dashboard", to: "/school", icon: LayoutDashboard }],
  teacher: [{ label: "Dashboard", to: "/teacher", icon: LayoutDashboard }],
  // teacher extended below
  student: [
    { label: "My Lab", to: "/student", icon: LayoutDashboard },
    { label: "Assignments", to: "/student/assignments", icon: ClipboardList },
    { label: "Projects", to: "/student/projects", icon: FolderKanban },
    { label: "Quizzes", to: "/student/quizzes", icon: BookOpen },
  ],
};

NAV.teacher = [
  { label: "Dashboard", to: "/teacher", icon: LayoutDashboard },
  { label: "Assignments", to: "/teacher/assignments", icon: ClipboardList },
  { label: "Projects", to: "/teacher/projects", icon: FolderKanban },
  { label: "Quizzes", to: "/teacher/quizzes", icon: BookOpen },
];

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  portal_manager: "Portal Manager",
  sales_rep: "Sales Representative",
  school: "School",
  teacher: "Teacher",
  student: "Student",
};

const ROLE_ICON: Record<AppRole, typeof ShieldCheck> = {
  admin: ShieldCheck,
  portal_manager: Users,
  sales_rep: Users,
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
  const { user, role, loading, signOut, session } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const secStatus = useServerFn(getMySecurityStatus);
  const [secChecked, setSecChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    } else if (requireRole && role && role !== requireRole) {
      navigate({ to: ROLE_HOME[role], replace: true });
      return;
    }
    if (user && session && !secChecked && !pathname.startsWith("/setup-security")) {
      secStatus().then((s) => {
        setSecChecked(true);
        if ((s as { mustSetupSecurity: boolean }).mustSetupSecurity) {
          navigate({ to: "/setup-security", replace: true });
        }
      }).catch(() => setSecChecked(true));
    }
  }, [user, session, role, loading, requireRole, navigate, secChecked, pathname, secStatus]);

  if (loading || !user || !role || (requireRole && role !== requireRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const nav = NAV[role];
  const RoleIcon = ROLE_ICON[role];

  const navLinks = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1.5 p-4">
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300",
              active
                ? "bg-gradient-to-r from-primary/90 to-primary-glow/80 text-primary-foreground shadow-lg shadow-primary/25"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent transition-all duration-300",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
              )}
            />
            <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !active && "group-hover:scale-110")} />
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border/60 px-6">
      <img src={avartanLogo.url} alt="Avartan" className="h-9 w-9 shrink-0 rounded-xl bg-white/95 object-contain p-0.5 shadow-md" />
      <div className="min-w-0">
        <div className="truncate font-display text-base font-bold leading-tight">Avartan Lab</div>
        <div className="truncate text-[0.65rem] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/50">
          Skill Platform
        </div>
      </div>
    </div>
  );

  const profileBlock = (
    <div className="border-t border-sidebar-border/60 p-4">
      <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 p-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md shadow-primary/25">
          <RoleIcon className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{user.user_metadata?.full_name ?? user.email}</div>
          <div className="truncate text-xs text-sidebar-foreground/60">{ROLE_LABEL[role]}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          className="h-9 w-9 shrink-0 text-sidebar-foreground/70 hover:bg-destructive/15 hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 40% at 85% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%), radial-gradient(45% 35% at 0% 100%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 70%)",
        }}
      />

      {/* Sidebar */}
      <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 text-sidebar-foreground backdrop-blur-xl lg:flex">
        {brand}
        {navLinks()}
        {profileBlock}
      </aside>

      {/* Main */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <div className="flex h-full flex-col">
                {brand}
                {navLinks()}
                {profileBlock}
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden lg:block" />

          <div className="min-w-0">
            <div className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {ROLE_LABEL[role]} Console
            </div>
            <h1 className="truncate font-display text-base font-bold tracking-tight sm:text-lg">{title ?? "Dashboard"}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/settings/change-password"
              className="hidden items-center gap-1.5 rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-md transition-all hover:border-primary/40 hover:text-foreground lg:inline-flex"
            >
              <KeyRound className="h-3.5 w-3.5" /> Change password
            </Link>
            <NotificationsBell />
          </div>
        </header>
        <main key={pathname} className="page-enter flex-1 p-5 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}