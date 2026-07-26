import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Student · Avartan Skill Lab" }] }),
  component: () => <Outlet />,
});