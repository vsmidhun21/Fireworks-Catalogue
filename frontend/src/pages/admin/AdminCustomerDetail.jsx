import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Receipt, Loader2 } from "lucide-react";
import { AdminCustomerService } from "../../services/api";
import { formatCurrency } from "../../utils/format";

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    AdminCustomerService.get(id).then((res) => setCustomer(res.data));
  }, [id]);

  if (!customer) {
    return (
      <div className="py-12 text-center text-brand-muted">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
        <span>Loading customer profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-brand-primary font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customers</span>
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">{customer.name}</h1>
        <p className="text-sm text-brand-muted">Customer details and order inquiry history</p>
      </div>

      <div className="card-surface p-6 rounded-2xl border border-brand-border/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-brand-primary pb-3 border-b border-brand-border">
          <User className="w-5 h-5" />
          <h2 className="font-display font-semibold text-brand-navy">Contact & Address Info</h2>
        </div>
        <dl className="text-sm space-y-2.5">
          <div className="flex justify-between"><dt className="text-brand-muted">Phone Number</dt><dd className="font-medium text-brand-navy">{customer.phone}</dd></div>
          {customer.email && <div className="flex justify-between"><dt className="text-brand-muted">Email Address</dt><dd className="font-medium text-brand-navy">{customer.email}</dd></div>}
          <div className="flex justify-between"><dt className="text-brand-muted">Address</dt><dd className="font-medium text-right text-brand-navy">{customer.address}</dd></div>
          <div className="flex justify-between"><dt className="text-brand-muted">City / State</dt><dd className="font-medium text-brand-navy">{customer.city}, {customer.state}</dd></div>
          <div className="flex justify-between"><dt className="text-brand-muted">Pincode</dt><dd className="font-medium text-brand-navy">{customer.pincode}</dd></div>
        </dl>
      </div>

      <div className="card-surface overflow-hidden border border-brand-border/80 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-brand-border flex items-center gap-2 text-brand-primary">
          <Receipt className="w-4 h-4" />
          <h2 className="font-display font-semibold text-brand-navy">Estimate History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-brand-muted border-b border-brand-border uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-4">Estimate #</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {customer.estimates?.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-mono font-medium">
                    <Link to={`/admin/estimates/${e.id}`} className="text-brand-primary hover:underline">
                      {e.estimateNumber}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-brand-navy">{formatCurrency(e.estimatedTotal)}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {e.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-xs text-brand-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {customer.estimates?.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-brand-muted">
                    No estimates yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
