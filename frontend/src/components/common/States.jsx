export function LoadingGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-surface overflow-hidden animate-pulse">
          <div className="aspect-square bg-brand-border/60" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-brand-border/60 rounded w-3/4" />
            <div className="h-3 bg-brand-border/60 rounded w-1/2" />
            <div className="h-8 bg-brand-border/60 rounded-full mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon = "🎆", title, description, action }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="font-display text-xl font-semibold text-brand-navy mb-2">{title}</h3>
      {description && <p className="text-brand-muted max-w-md mx-auto mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4">⚠️</div>
      <p className="text-brand-error font-medium">{message}</p>
    </div>
  );
}
