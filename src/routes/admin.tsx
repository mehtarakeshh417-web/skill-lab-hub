import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administrator · Avartan Skill Lab" }] }),
  component: () => <Outlet />,
});