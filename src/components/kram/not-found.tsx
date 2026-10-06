import { Link } from "@tanstack/react-router";

export function NotFoundView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-sm font-medium tracking-[0.2em] text-primary">KRAM</div>
        <h1 className="mt-3 text-6xl font-semibold tabular text-foreground">404</h1>
        <h2 className="mt-3 text-lg font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/dashboard" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

