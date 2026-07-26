import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { DirectoryWorkspace } from "@/components/directory-workspace";
import { getDirectory } from "@/lib/directory.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/manager/directory")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : "schools",
    status: typeof search.status === "string" ? search.status : "all",
  }),
  head: () => ({
    meta: [
      { title: "Directory — Avartan Manager Console" },
      { name: "description", content: "Browse the schools, teachers, students and sales representatives you manage on the Avartan Skill Lab portal." },
      { property: "og:title", content: "Directory — Avartan Manager Console" },
      { property: "og:description", content: "Schools, teachers, students and sales representatives with search, filters and exports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManagerDirectoryPage,
});

const VALID_TABS = ["schools", "teachers", "students", "salesReps"] as const;

function ManagerDirectoryPage() {
  const { session } = useAuth();
  const { tab, status } = Route.useSearch();
  const load = useServerFn(getDirectory);
  const queryClient = useQueryClient();

  const initialTab = (VALID_TABS as readonly string[]).includes(tab) ? (tab as (typeof VALID_TABS)[number]) : "schools";
  const initialStatus = ["all", "active", "inactive"].includes(status) ? status : "all";
  const [filters, setFilters] = useState({ search: "", state: "all", city: "all", region: "all", schoolId: "all", status: initialStatus });

  const query = useQuery({
    queryKey: ["directory", "manager", filters],
    queryFn: () => load({ data: filters }),
    enabled: Boolean(session),
    retry: false,
  });

  const data = useMemo(() => query.data, [query.data]);

  return (
    <AppShell requireRole="portal_manager" title="Directory">
      <DirectoryWorkspace
        key={`${initialTab}-${initialStatus}`}
        data={data}
        defaultTab={initialTab}
        loading={query.isLoading}
        filters={filters}
        onFilters={setFilters}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ["directory"] });
          queryClient.invalidateQueries({ queryKey: ["schools", "dashboard"] });
        }}
      />
    </AppShell>
  );
}