import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/kram/auth-layout";
import { FieldError } from "@/components/kram/bits";
import { cn } from "@/lib/utils";
import { sleep, useKram } from "@/lib/store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create an account — KRAM" },
      { name: "description", content: "Create your KRAM workspace and start organizing projects and tasks." },
      { property: "og:title", content: "Create an account — KRAM" },
      { property: "og:description", content: "Organize work. Move forward." },
    ],
  }),
  component: Register,
});

const schema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(60),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return s;
}
const sLabel = ["Too short", "Weak", "Fair", "Good", "Strong"];
const sTone = ["bg-border", "bg-destructive", "bg-amber", "bg-primary", "bg-sage"];

function Register() {
  const reg = useKram((s) => s.register);
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const pw = watch("password") ?? "";
  const st = strength(pw);

  const onSubmit = async (v: z.infer<typeof schema>) => {
    const r = await reg(v.fullName, v.email, v.password);
    if (r === "duplicate") {
      setError("email", { message: "An account with this email already exists" });
      toast.error("Email already registered");
      return;
    }
    toast.success("Account created — welcome to KRAM");
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Set up your workspace in under a minute.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" className="mt-1.5" autoComplete="name" {...register("fullName")} />
          <FieldError msg={errors.fullName?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1.5" autoComplete="email" {...register("email")} />
          <FieldError msg={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" className="mt-1.5" autoComplete="new-password" {...register("password")} />
          {pw && (
            <div className="mt-2">
              <div className="flex gap-1">{[1, 2, 3, 4].map((i) => <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= st ? sTone[st] : "bg-sand")} />)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{sLabel[st]}</div>
            </div>
          )}
          <FieldError msg={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" className="mt-1.5" autoComplete="new-password" {...register("confirm")} />
          <FieldError msg={errors.confirm?.message} />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Create Account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-medium text-primary hover:text-primary-hover">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
