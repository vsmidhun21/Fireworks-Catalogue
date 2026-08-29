import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Receipt, Search, Filter, Loader2, ArrowRight } from "lucide-react";
import { AdminEstimateService } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const statuses = ["", "NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
const statusColors = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-navy">Estimates & Enquiries</h1>
          <p className="text-sm text-brand-muted">Track customer orders, follow up, and update statuses</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              placeholder="Search estimate #, customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border border-brand-border pl-9 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-brand-primary"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full border border-brand-border px-4 py-2 text-sm bg-white focus:outline-none focus:border-brand-primary"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s ? `${s} Status` : "All Statuses"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-surface overflow-hidden border border-brand-border/80 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-brand-muted border-b border-brand-border uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">Estimate #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                    <span>Loading estimates...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-muted">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-brand-border" />
                    <span>No estimates found.</span>
                  </td>
                </tr>
              ) : (
                items.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium">
                      <Link to={`/admin/estimates/${e.id}`} className="text-brand-primary hover:underline font-semibold">
                        {e.estimateNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-brand-navy">{e.customer?.name}</td>
                    <td className="py-3 px-4 text-brand-muted">{e.customer?.phone}</td>
                    <td className="py-3 px-4 font-bold text-brand-navy">{formatCurrency(e.estimatedTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[e.status] || "bg-slate-100"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-brand-muted">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
