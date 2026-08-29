import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminDashboardService } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const statusColors = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    AdminDashboardService.get().then((res) => setData(res.data));
  }, []);

  const cards = data
    ? [
        { label: "Total Products", value: data.totalProducts, icon: "🎆" },
        { label: "Featured Products", value: data.featuredProducts, icon: "⭐" },
        { label: "Categories", value: data.totalCategories, icon: "🗂️" },
        { label: "New Estimates", value: data.newEstimates, icon: "🆕" },
        { label: "Pending Estimates", value: data.pendingEstimates, icon: "⏳" },
        { label: "Completed Estimates", value: data.completedEstimates, icon: "✅" },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-navy mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-5">
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className="text-2xl font-bold text-brand-navy">{c.value ?? "-"}</p>
            <p className="text-sm text-brand-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-brand-navy">Recent Estimates</h2>
          <Link to="/admin/estimates" className="text-sm text-brand-primary font-semibold hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-brand-muted border-b border-brand-border">
                <th className="py-2 pr-4">Estimate #</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentEstimates?.map((e) => (
                <tr key={e.id} className="border-b border-brand-border/60 hover:bg-brand-cream">
                  <td className="py-2.5 pr-4">
                    <Link to={`/admin/estimates/${e.id}`} className="font-semibold text-brand-primary">{e.estimateNumber}</Link>
                  </td>
                  <td className="py-2.5 pr-4">{e.customerName}</td>
                  <td className="py-2.5 pr-4">{formatCurrency(e.total)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[e.status] || "bg-gray-100"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-brand-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data?.recentEstimates?.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-brand-muted">No estimates yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
