import { createFileRoute } from "@tanstack/react-router";
import { NotFoundView } from "@/components/kram/not-found";

export const Route = createFileRoute("/404")({
  head: () => ({ meta: [{ title: "Page not found — KRAM" }, { name: "description", content: "This page doesn't exist." }, { property: "og:title", content: "Page not found — KRAM" }, { property: "og:description", content: "This page doesn't exist." }, { name: "robots", content: "noindex" }] }),
  component: NotFoundView,
});
