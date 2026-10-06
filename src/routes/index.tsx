import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/kram/bits";
import { useKram } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KRAM — Project & task management" },
      { name: "description", content: "Plan projects, track tasks and see progress in one calm workspace." },
      { property: "og:title", content: "KRAM — Project & task management" },
      { property: "og:description", content: "Plan projects, track tasks and see progress in one calm workspace." },
    ],
  }),
  component: Index,
});

function Index() {
  const hydrated = useKram((s) => s.hydrated);
  const authed = useKram((s) => !!s.currentUserId);
  const navigate = useNavigate();
  useEffect(() => {
    if (hydrated) navigate({ to: authed ? "/dashboard" : "/login", replace: true });
  }, [hydrated, authed, navigate]);
  return <div className="grid min-h-screen place-items-center"><Logo /></div>;
}
