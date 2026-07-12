import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/school")({
  head: () => ({ meta: [{ title: "School · Avartan Skill Lab" }] }),
  component: () => <Outlet />,
});