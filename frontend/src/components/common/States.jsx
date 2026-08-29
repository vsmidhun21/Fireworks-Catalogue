import { PackageSearch, AlertTriangle } from "lucide-react";

export function LoadingGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-surface overflow-hidden animate-pulse rounded-2xl border border-brand-border">
          <div className="aspect-square bg-slate-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-9 bg-slate-200 rounded-full mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = PackageSearch, title, description, action }) {
  const isComponent = typeof Icon === "function" || (typeof Icon === "object" && Icon !== null && !Icon.$$typeof);

  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4">
        {isComponent ? <Icon className="w-8 h-8" /> : Icon}
      </div>
      <h3 className="font-display text-xl font-bold text-brand-navy mb-2">{title}</h3>
      {description && <p className="text-brand-muted max-w-md mx-auto mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <p className="text-brand-error font-medium">{message}</p>
    </div>
  );
}
