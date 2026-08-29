import { Link } from "react-router-dom";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4">
        <FileQuestion className="w-10 h-10" />
      </div>
      <h1 className="font-display text-2xl font-bold text-brand-navy mb-2">Page not found</h1>
      <p className="text-brand-muted mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <Home className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
