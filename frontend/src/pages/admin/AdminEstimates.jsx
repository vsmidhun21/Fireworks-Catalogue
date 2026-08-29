import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminEstimateService } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const statuses = ["", "NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
const statusColors = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminEstimates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  function load() {
    setLoading(true);
    AdminEstimateService.list({ search, status, limit: 50 })
      .then((res) => setItems(res.data.items))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-brand-navy">Estimates</h1>
        <div className="flex gap-3">
          <input
            placeholder="Search estimate #, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border border-brand-border px-4 py-2 text-sm w-64"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-brand-border px-4 py-2 text-sm">
            {statuses.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
          </select>
        </div>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-brand-muted border-b border-brand-border">
              <th className="py-3 px-4">Estimate #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-6 text-center text-brand-muted">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-brand-muted">No estimates found.</td></tr>
            ) : (
              items.map((e) => (
                <tr key={e.id} className="border-b border-brand-border/60 hover:bg-brand-cream">
                  <td className="py-2.5 px-4">
                    <Link to={`/admin/estimates/${e.id}`} className="font-semibold text-brand-primary">{e.estimateNumber}</Link>
                  </td>
                  <td className="py-2.5 px-4">{e.customer?.name}</td>
                  <td className="py-2.5 px-4 text-brand-muted">{e.customer?.phone}</td>
                  <td className="py-2.5 px-4">{formatCurrency(e.estimatedTotal)}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[e.status] || "bg-gray-100"}`}>{e.status}</span>
                  </td>
                  <td className="py-2.5 px-4 text-brand-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
