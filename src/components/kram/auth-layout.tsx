import type { ReactNode } from "react";
import { Logo } from "./bits";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r bg-warm lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo />
        <div aria-hidden className="pointer-events-none absolute -left-10 bottom-24 h-40 w-40 rounded-full bg-sage/20 float-slower" />
        <div aria-hidden className="pointer-events-none absolute right-10 top-20 h-24 w-24 rounded-2xl bg-amber/25 float-slow" />
        <div aria-hidden className="absolute inset-0 flex items-center justify-center">
          <div className="grid w-[420px] grid-cols-6 gap-3 opacity-90">
            {Array.from({ length: 36 }).map((_, i) => {
              const r = Math.floor(i / 6), c = i % 6;
              const filled = c <= r - 1;
              const tone = c === r - 1 ? "bg-primary" : filled ? (c % 2 ? "bg-sand" : "bg-peach") : "border border-border";
              return <div key={i} style={{ animationDelay: `${(r + c) * 70}ms` }} className={`pop-in aspect-square rounded-md transition-transform duration-300 hover:scale-110 ${tone} ${c === r - 1 ? "shadow-lift pulse-warm" : ""}`} />;
            })}
          </div>
        </div>
        <div className="fade-up relative max-w-sm" style={{ animationDelay: "500ms" }}>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Organize work.<br /><span className="text-primary">Move forward.</span></h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Kram — order, sequence, structure. A calm workspace where every project and task has its place.</p>
        </div>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="fade-up w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /><p className="mt-2 text-sm text-muted-foreground">Organize work. Move forward.</p></div>
          {children}
        </div>
      </main>
    </div>
  );
}
