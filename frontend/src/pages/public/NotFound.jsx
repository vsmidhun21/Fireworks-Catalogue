import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <div className="text-6xl mb-4">🎇</div>
      <h1 className="font-display text-2xl font-bold text-brand-navy mb-2">Page not found</h1>
      <p className="text-brand-muted mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
