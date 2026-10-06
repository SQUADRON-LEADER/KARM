import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "@/components/kram/auth-layout";
import { FieldError } from "@/components/kram/bits";
import { useKram } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — KRAM" },
      { name: "description", content: "Sign in to KRAM to continue managing your projects and tasks." },
      { property: "og:title", content: "Sign in — KRAM" },
      { property: "og:description", content: "Organize work. Move forward." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

function Login() {
  const login = useKram((s) => s.login);
  const hydrated = useKram((s) => s.hydrated);
  const authed = useKram((s) => !!s.currentUserId);
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => { if (hydrated && authed) navigate({ to: "/dashboard", replace: true }); }, [hydrated, authed, navigate]);

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setError(null);
    const u = await login(v.email, v.password);
    if (!u) {
      setError("Invalid email or password. Please try again.");
      toast.error("Invalid credentials");
      return;
    }
    toast.success(`Welcome back, ${u.fullName.split(" ")[0]}`);
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to continue managing your work.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-peach/60 px-3 py-2 text-sm text-destructive">{error}</div>}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="mt-1.5" placeholder="you@company.com" {...register("email")} />
          <FieldError msg={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1.5">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" className="pr-10" {...register("password")} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError msg={errors.password?.message} />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={remember} onCheckedChange={(c) => setRemember(!!c)} /> Remember me
        </label>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to KRAM? <Link to="/register" className="font-medium text-primary hover:text-primary-hover">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
