import { useEffect, useLayoutEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExtras } from "@/lib/extras";
import { useCurrentUser } from "@/lib/store";

const steps = [
  { sel: null, title: "Welcome to KRAM 👋", body: "A quick 30-second tour of your new workspace." },
  { sel: '[data-tour="nav"]', title: "Everything in one place", body: "Dashboard, projects, tasks, calendar and reports live here." },
  { sel: '[data-tour="search"]', title: "Find anything", body: "Search projects and tasks instantly from the top bar." },
  { sel: '[data-tour="cmdk"]', title: "Power moves", body: "Press Ctrl/⌘ + K for the command menu and shortcuts." },
  { sel: '[data-tour="theme"]', title: "Make it yours", body: "Switch dark mode here, or pick a color theme in Settings." },
  { sel: null, title: "Focus & checklists", body: "Open any task's menu to add steps or start a 25-minute focus timer. Have fun!" },
];

export function startTour() { window.dispatchEvent(new Event("kram:tour")); }

export function WelcomeTour() {
  const user = useCurrentUser();
  const done = useExtras((s) => (user ? s.tourDone[user.id] : true));
  const setDone = useExtras((s) => s.setTourDone);
  const [i, setI] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => { if (user && !done) { const t = setTimeout(() => setI(0), 900); return () => clearTimeout(t); } return undefined; }, [user, done]);
  useEffect(() => { const h = () => setI(0); window.addEventListener("kram:tour", h); return () => window.removeEventListener("kram:tour", h); }, []);

  useLayoutEffect(() => {
    if (i === null) return;
    const upd = () => {
      const sel = steps[i]?.sel;
      const el = sel ? Array.from(document.querySelectorAll(sel)).find((e) => (e as HTMLElement).offsetParent !== null) : null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, [i]);

  if (i === null || !user) return null;
  const step = steps[i]!;
  const finish = () => { setI(null); setDone(user.id, true); };
  const pad = 8;
  const box = rect ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  const cardStyle = box
    ? { left: Math.min(Math.max(12, box.left), window.innerWidth - 332), top: box.top + box.height + 220 > window.innerHeight ? Math.max(12, box.top - 190) : box.top + box.height + 12 }
    : { left: "50%", top: "50%", transform: "translate(-50%,-50%)" };

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Welcome tour">
      {box ? <div className="tour-spot" style={box} /> : <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] fade-in" />}
      <div key={i} className="pop-in absolute w-80 rounded-2xl border bg-popover p-5 shadow-lift" style={cardStyle}>
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="h-3.5 w-3.5" /> Step {i + 1} of {steps.length}</div>
        <h3 className="text-lg font-semibold">{step.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center gap-1">{steps.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? "w-5 bg-primary" : "w-1.5 bg-muted"}`} />)}</div>
        <div className="mt-4 flex justify-between">
          <Button variant="ghost" size="sm" onClick={finish}>Skip</Button>
          <div className="flex gap-2">
            {i > 0 && <Button variant="outline" size="sm" onClick={() => setI(i - 1)}>Back</Button>}
            <Button size="sm" onClick={() => (i === steps.length - 1 ? finish() : setI(i + 1))}>{i === steps.length - 1 ? "Let's go" : "Next"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
