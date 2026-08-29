import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-navy mb-6">Customers</h1>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-brand-muted border-b border-brand-border">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">City</th>
              <th className="py-3 px-4">Estimates</th>
              <th className="py-3 px-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-6 text-center text-brand-muted">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-brand-muted">No customers yet.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-brand-border/60 hover:bg-brand-cream">
                  <td className="py-2.5 px-4">
                    <Link to={`/admin/customers/${c.id}`} className="font-semibold text-brand-primary">{c.name}</Link>
                  </td>
                  <td className="py-2.5 px-4 text-brand-muted">{c.phone}</td>
                  <td className="py-2.5 px-4 text-brand-muted">{c.city}</td>
                  <td className="py-2.5 px-4">{c.estimateCount}</td>
                  <td className="py-2.5 px-4 text-brand-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
