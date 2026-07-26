import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { DirectoryWorkspace } from "@/components/directory-workspace";
import { getDirectory } from "@/lib/directory.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/directory")({
  validateSearch: (search: Record<string, unknown>): { tab?: string; status?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : "schools",
    status: typeof search.status === "string" ? search.status : "all",
  }),
  head: () => ({
    meta: [
      { title: "Directory — Avartan Admin Console" },
      { name: "description", content: "Browse every school, teacher, student and sales representative on the Avartan Skill Lab portal with region, state and school filters." },
      { property: "og:title", content: "Directory — Avartan Admin Console" },
      { property: "og:description", content: "Full portal directory with filters, exports and account controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DirectoryPage,
});

function DirectoryPage() {
  const { session } = useAuth();
  const { tab, status } = Route.useSearch();
  const load = useServerFn(getDirectory);
  const queryClient = useQueryClient();
  const validTabs = ["schools", "teachers", "students", "salesReps"] as const;
  const initialTab = (validTabs as readonly string[]).includes(tab) ? (tab as (typeof validTabs)[number]) : "schools";
  const initialStatus = ["all", "active", "inactive"].includes(status) ? status : "all";
  const [filters, setFilters] = useState({ search: "", state: "all", city: "all", region: "all", schoolId: "all", status: initialStatus });

  const query = useQuery({
    queryKey: ["directory", filters],
    queryFn: () => load({ data: filters }),
    enabled: Boolean(session),
    retry: false,
  });

  const data = useMemo(() => query.data, [query.data]);

  return (
    <AppShell requireRole="admin" title="Portal Directory">
      <DirectoryWorkspace
        data={data}
        key={`${initialTab}-${initialStatus}`}
        defaultTab={initialTab}
        loading={query.isLoading}
        filters={filters}
        onFilters={setFilters}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ["directory"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
        }}
      />
    </AppShell>
  );
}