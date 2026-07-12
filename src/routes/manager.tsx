import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/manager")({
  head: () => ({ meta: [{ title: "Portal Manager · Avartan Skill Lab" }] }),
  component: () => <Outlet />,
});