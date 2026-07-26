import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Teacher · Avartan Skill Lab" }] }),
  component: () => <Outlet />,
});