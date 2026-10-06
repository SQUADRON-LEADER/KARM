import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, LogOut, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, Card, FieldError, PageHeader } from "@/components/kram/bits";
import { ConfirmDialog } from "@/components/kram/forms";
import { sleep, THEMES, themeMeta, useCurrentUser, useKram, usePrefs, type ThemeName } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — KRAM" },
      { name: "description", content: "Manage your KRAM profile, preferences and account." },
      { property: "og:title", content: "Settings — KRAM" },
      { property: "og:description", content: "Manage your KRAM profile, preferences and account." },
    ],
  }),
  component: SettingsPage,
});

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(60),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <Card className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
      <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{sub}</p></div>
      <div>{children}</div>
    </Card>
  );
}

function SettingsPage() {
  const user = useCurrentUser()!;
  const prefs = usePrefs();
  const { updateProfile, setPrefs, logout, resetDemo } = useKram.getState();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(user.avatar);
  const [reset, setReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { fullName: user.fullName, email: user.email } });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    await sleep(500);
    if (!updateProfile({ ...v, avatar })) { setError("email", { message: "This email is used by another account" }); return; }
    toast.success("Profile updated");
  };

  const onFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (f.size > 1_000_000) { toast.error("Image must be under 1 MB"); return; }
    const r = new FileReader();
    r.onload = () => setAvatar(String(r.result));
    r.readAsDataURL(f);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Manage your profile and workspace preferences." />
      <Section title="Profile" sub="How you appear across KRAM.">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
          <div className="flex items-center gap-4">
            <Avatar name={user.fullName} src={avatar} className="h-14 w-14 text-base" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Upload</Button>
              {avatar && <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(undefined)}>Remove</Button>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
          </div>
          <div><Label htmlFor="sname">Full name</Label><Input id="sname" className="mt-1.5" {...register("fullName")} /><FieldError msg={errors.fullName?.message} /></div>
          <div><Label htmlFor="semail">Email</Label><Input id="semail" type="email" className="mt-1.5" {...register("email")} /><FieldError msg={errors.email?.message} /></div>
          <Button type="submit" disabled={isSubmitting || (!isDirty && avatar === user.avatar)}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes</Button>
        </form>
      </Section>
      <Section title="Preferences" sub="Saved to this device.">
        <div className="max-w-md divide-y">
          <label className="flex items-center justify-between py-3 first:pt-0">
            <span><span className="block text-sm font-medium">Notifications</span><span className="text-xs text-muted-foreground">Show activity in the notification panel.</span></span>
            <Switch checked={prefs.notifications} onCheckedChange={(c) => { setPrefs({ notifications: c }); toast.success(`Notifications ${c ? "on" : "off"}`); }} />
          </label>
          <label className="flex items-center justify-between py-3">
            <span><span className="block text-sm font-medium">Compact mode</span><span className="text-xs text-muted-foreground">Slightly denser text across the app.</span></span>
            <Switch checked={prefs.compact} onCheckedChange={(c) => { setPrefs({ compact: c }); toast.success(`Compact mode ${c ? "on" : "off"}`); }} />
          </label>
        </div>
      </Section>
      <Section title="Appearance" sub="Pick a color theme and light or dark mode.">
        <div className="max-w-md space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => { setPrefs({ theme: t }); toast.success(`${themeMeta[t].label} theme on`); }}
                aria-pressed={prefs.theme === t}
                className={cn(
                  "group rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift press",
                  prefs.theme === t ? "gradient-border shadow-soft" : "",
                )}
              >
                <span className="mb-2 flex gap-1">
                  {themeMeta[t].swatch.map((c) => <span key={c} className="h-5 w-5 rounded-full ring-1 ring-border" style={{ background: c }} />)}
                </span>
                <span className="text-sm font-medium">{themeMeta[t].label}</span>
                {prefs.theme === t && <span className="ml-1 text-xs text-primary">•</span>}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <span><span className="block text-sm font-medium">Dark mode</span><span className="text-xs text-muted-foreground">Also toggleable from the top bar.</span></span>
            <Switch checked={prefs.dark} onCheckedChange={(c) => { setPrefs({ dark: c }); toast.success(`${c ? "Dark" : "Light"} mode on`); }} />
          </label>
        </div>
      </Section>
      <Section title="Account" sub="Session and workspace data.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={async () => { await logout(); toast.success("Signed out"); navigate({ to: "/login" }); }}><LogOut className="h-4 w-4" /> Log out</Button>
          <Button variant="outline" onClick={() => setReset(true)}><RotateCcw className="h-4 w-4" /> Refresh Workspace</Button>
        </div>
      </Section>
      <ConfirmDialog open={reset} onOpenChange={setReset} title="Refresh workspace?" message="This will synchronize all your projects and tasks from the database." confirmLabel="Refresh Data" onConfirm={async () => { await resetDemo(); toast.success("Workspace refreshed"); }} />
    </div>
  );
}
