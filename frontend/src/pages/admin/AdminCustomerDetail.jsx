import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminCustomerService } from "../../services/api";
import { formatCurrency } from "../../utils/format";

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    AdminCustomerService.get(id).then((res) => setCustomer(res.data));
  }, [id]);

  if (!customer) return <p className="text-brand-muted">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/admin/customers" className="text-sm text-brand-primary font-semibold hover:underline">← Back to Customers</Link>
      <h1 className="font-display text-2xl font-bold text-brand-navy mt-3 mb-6">{customer.name}</h1>

      <div className="card-surface p-5 mb-6">
        <dl className="text-sm space-y-1.5">
          <div className="flex justify-between"><dt className="text-brand-muted">Phone</dt><dd className="font-medium">{customer.phone}</dd></div>
          {customer.email && <div className="flex justify-between"><dt className="text-brand-muted">Email</dt><dd className="font-medium">{customer.email}</dd></div>}
          <div className="flex justify-between"><dt className="text-brand-muted">Address</dt><dd className="font-medium text-right">{customer.address}</dd></div>
          <div className="flex justify-between"><dt className="text-brand-muted">City / State</dt><dd className="font-medium">{customer.city}, {customer.state}</dd></div>
          <div className="flex justify-between"><dt className="text-brand-muted">Pincode</dt><dd className="font-medium">{customer.pincode}</dd></div>
        </dl>
      </div>

      <h2 className="font-display font-semibold text-brand-navy mb-3">Estimate History</h2>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-brand-muted border-b border-brand-border">
              <th className="py-3 px-4">Estimate #</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {customer.estimates?.map((e) => (
              <tr key={e.id} className="border-b border-brand-border/60 hover:bg-brand-cream">
                <td className="py-2.5 px-4">
                  <Link to={`/admin/estimates/${e.id}`} className="font-semibold text-brand-primary">{e.estimateNumber}</Link>
                </td>
                <td className="py-2.5 px-4">{formatCurrency(e.estimatedTotal)}</td>
                <td className="py-2.5 px-4">{e.status}</td>
                <td className="py-2.5 px-4 text-brand-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {customer.estimates?.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-brand-muted">No estimates yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
