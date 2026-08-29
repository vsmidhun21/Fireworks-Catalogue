import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Loader2 } from "lucide-react";
import { AdminCustomerService } from "../../services/api";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminCustomerService.list()
      .then((res) => setCustomers(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">Registered Customers</h1>
        <p className="text-sm text-brand-muted">Directory of clients who submitted estimates</p>
      </div>

      <div className="card-surface overflow-hidden border border-brand-border/80 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-brand-muted border-b border-brand-border uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4 text-center">Estimates</th>
                <th className="py-3.5 px-4 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                    <span>Loading customers...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-muted">
                    <Users className="w-8 h-8 mx-auto mb-2 text-brand-border" />
                    <span>No customers found yet.</span>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-brand-navy">
                      <Link to={`/admin/customers/${c.id}`} className="text-brand-primary hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-brand-muted">{c.phone}</td>
                    <td className="py-3 px-4 text-brand-muted">{c.city || "-"}</td>
                    <td className="py-3 px-4 text-center font-semibold text-brand-navy">{c.estimateCount}</td>
                    <td className="py-3 px-4 text-right text-xs text-brand-muted">
                      {new Date(c.createdAt).toLocaleDateString()}
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
