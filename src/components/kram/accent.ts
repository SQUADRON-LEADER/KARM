/** Deterministic warm accent per project, so each project keeps its own color everywhere. */
const accents = [
  { bar: "bg-primary", text: "text-primary", soft: "bg-peach" },
  { bar: "bg-sage", text: "text-sage", soft: "bg-sage-soft" },
  { bar: "bg-amber", text: "text-amber", soft: "bg-amber-soft" },
  { bar: "bg-brown", text: "text-brown", soft: "bg-sand" },
  { bar: "bg-primary-hover", text: "text-primary-hover", soft: "bg-peach" },
  { bar: "bg-olive", text: "text-olive", soft: "bg-sage-soft" },
];
export function accentFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return accents[h % accents.length]!;
}

/** Small burst of warm confetti from a screen point. */
export function burst(x: number, y: number) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["var(--primary)", "var(--sage)", "var(--amber)", "var(--primary-hover)", "var(--brown)"];
  for (let i = 0; i < 14; i++) {
    const d = document.createElement("span");
    d.className = "burst-dot";
    const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const r = 26 + Math.random() * 30;
    d.style.left = `${x - 3}px`; d.style.top = `${y - 3}px`;
    d.style.background = colors[i % colors.length]!;
    d.style.setProperty("--dx", `${Math.cos(a) * r}px`);
    d.style.setProperty("--dy", `${Math.sin(a) * r}px`);
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }
}
