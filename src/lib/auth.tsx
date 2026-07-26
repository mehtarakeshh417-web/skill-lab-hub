import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import {
  getMockSession,
  mockSignOut,
  seedDefaultMockAccounts,
  subscribeMockSession,
  type MockSession,
} from "./mock-auth";

export type AppRole = "admin" | "portal_manager" | "sales_rep" | "school" | "teacher" | "student";

type AuthState = {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [mock, setMock] = useState<MockSession | null>(null);

  useEffect(() => {
    // Make sure the five default seed accounts exist before anything else.
    seedDefaultMockAccounts();
    const initialMock = getMockSession();
    if (initialMock) {
      if (["admin", "portal_manager", "school", "sales_rep"].includes(initialMock.role)) {
        mockSignOut();
      } else {
        setMock(initialMock);
        setRole(initialMock.role);
        setLoading(false);
      }
    }
    const unsubMock = subscribeMockSession(() => {
      const next = getMockSession();
      if (next && ["admin", "portal_manager", "school", "sales_rep"].includes(next.role)) {
        mockSignOut();
        return;
      }
      setMock(next);
      if (next) {
        setRole(next.role);
        setLoading(false);
      } else if (!session) {
        setRole(null);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        mockSignOut();
        setMock(null);
        // defer role fetch
        setTimeout(() => {
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", s.user.id)
            .maybeSingle()
            .then(({ data }) => {
              setRole((data?.role as AppRole) ?? "student");
              setLoading(false);
            });
        }, 0);
      } else {
        if (!getMockSession()) {
          setRole(null);
        }
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session && !getMockSession()) setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
      unsubMock();
    };
  }, []);

  const mockUser: User | null = mock
    ? ({
        id: `mock-${mock.username}`,
        email: mock.email,
        user_metadata: { full_name: mock.fullName, username: mock.username },
        app_metadata: { provider: "mock" },
        aud: "authenticated",
        created_at: new Date(mock.issuedAt).toISOString(),
      } as unknown as User)
    : null;

  const value: AuthState = {
    user: session?.user ?? mockUser,
    session,
    role,
    loading,
    signOut: async () => {
      const identifier =
        (session?.user?.user_metadata?.username as string | undefined) ??
        session?.user?.email ??
        mock?.username ??
        null;
      const { recordAuthEvent } = await import("./audit.functions");
      void recordAuthEvent({ data: { event: "logout", identifier } }).catch(() => null);
      mockSignOut();
      setMock(null);
      setRole(null);
      await supabase.auth.signOut();
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/admin",
  portal_manager: "/manager",
  sales_rep: "/sales-rep",
  school: "/school",
  teacher: "/teacher",
  student: "/student",
};