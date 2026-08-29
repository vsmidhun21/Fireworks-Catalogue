import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Star,
  FolderTree,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Receipt,
} from "lucide-react";
import { AdminDashboardService } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const statusColors = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminDashboardService.get()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = data
    ? [
        { label: "Total Products", value: data.totalProducts, icon: Package, color: "text-blue-600 bg-blue-50" },
        { label: "Featured Products", value: data.featuredProducts, icon: Star, color: "text-amber-600 bg-amber-50" },
        { label: "Categories", value: data.totalCategories, icon: FolderTree, color: "text-indigo-600 bg-indigo-50" },
        { label: "New Estimates", value: data.newEstimates, icon: Sparkles, color: "text-orange-600 bg-orange-50" },
        { label: "Pending Estimates", value: data.pendingEstimates, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
        { label: "Completed Estimates", value: data.completedEstimates, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">Dashboard Overview</h1>
        <p className="text-sm text-brand-muted">Real-time stats and customer estimates</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-brand-muted">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
          <span>Loading dashboard statistics...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="card-surface p-5 rounded-2xl border border-brand-border/80 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-brand-navy">{c.value ?? "-"}</p>
                    <p className="text-xs font-semibold text-brand-muted mt-0.5">{c.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card-surface p-6 rounded-2xl border border-brand-border/80 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-primary" />
                <h2 className="font-display font-bold text-brand-navy">Recent Estimates</h2>
              </div>
              <Link to="/admin/estimates" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-brand-muted border-b border-brand-border text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 pr-4">Estimate #</th>
                    <th className="py-2.5 pr-4">Customer</th>
                    <th className="py-2.5 pr-4">Total</th>
                    <th className="py-2.5 pr-4 text-center">Status</th>
                    <th className="py-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {data?.recentEstimates?.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4 font-mono font-medium">
                        <Link to={`/admin/estimates/${e.id}`} className="text-brand-primary hover:underline">
                          {e.estimateNumber}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-medium text-brand-navy">{e.customerName}</td>
                      <td className="py-3 pr-4 font-bold text-brand-navy">{formatCurrency(e.total)}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[e.status] || "bg-slate-100 text-slate-700"}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs text-brand-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {data?.recentEstimates?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-brand-muted">
                        No estimates yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
