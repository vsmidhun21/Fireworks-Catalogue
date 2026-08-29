import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminEstimateService } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const statuses = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function AdminEstimateDetail() {
  const { id } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  function load() {
    AdminEstimateService.get(id).then((res) => {
      setEstimate(res.data);
      setNotes(res.data.adminNotes || "");
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(status) {
    await AdminEstimateService.setStatus(id, status);
    load();
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await AdminEstimateService.setNotes(id, notes);
      load();
    } finally {
      setSavingNotes(false);
    }
  }

  if (!estimate) return <p className="text-brand-muted">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/estimates" className="text-sm text-brand-primary font-semibold hover:underline">← Back to Estimates</Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-brand-navy">{estimate.estimateNumber}</h1>
        <select
          value={estimate.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold"
        >
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="card-surface p-5">
          <h2 className="font-display font-semibold text-brand-navy mb-3">Customer Details</h2>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-brand-muted">Name</dt><dd className="font-medium">{estimate.customer?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-muted">Phone</dt><dd className="font-medium">{estimate.customer?.phone}</dd></div>
            {estimate.customer?.email && <div className="flex justify-between"><dt className="text-brand-muted">Email</dt><dd className="font-medium">{estimate.customer.email}</dd></div>}
            <div className="flex justify-between"><dt className="text-brand-muted">City</dt><dd className="font-medium">{estimate.customer?.city}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-muted">State</dt><dd className="font-medium">{estimate.customer?.state}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-muted">Pincode</dt><dd className="font-medium">{estimate.customer?.pincode}</dd></div>
          </dl>
          <p className="text-sm text-brand-muted mt-3">{estimate.customer?.address}</p>
        </div>

        <div className="card-surface p-5">
          <h2 className="font-display font-semibold text-brand-navy mb-3">Summary</h2>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-brand-muted">Subtotal</dt><dd>{formatCurrency(estimate.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-muted">Discount</dt><dd className="text-brand-success">-{formatCurrency(estimate.totalDiscount)}</dd></div>
            <div className="flex justify-between font-bold text-brand-navy border-t border-brand-border pt-2 mt-1">
              <dt>Estimated Total</dt><dd>{formatCurrency(estimate.estimatedTotal)}</dd>
            </div>
            <div className="flex justify-between"><dt className="text-brand-muted">Submitted</dt><dd>{new Date(estimate.createdAt).toLocaleString()}</dd></div>
          </dl>
        </div>
      </div>

      <div className="card-surface overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-brand-muted border-b border-brand-border">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Qty</th>
              <th className="py-3 px-4">Unit Price</th>
              <th className="py-3 px-4">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {estimate.items?.map((item) => (
              <tr key={item.id} className="border-b border-brand-border/60">
                <td className="py-2.5 px-4">
                  <p className="font-medium text-brand-navy">{item.productNameEn}</p>
                  <p className="text-xs text-brand-muted">{item.productCode} · {item.unit}</p>
                </td>
                <td className="py-2.5 px-4">{item.quantity}</td>
                <td className="py-2.5 px-4">{formatCurrency(item.discountedUnitPrice ?? item.originalUnitPrice)}</td>
                <td className="py-2.5 px-4 font-semibold">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-surface p-5">
        <h2 className="font-display font-semibold text-brand-navy mb-3">Admin Notes</h2>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
          placeholder="Internal notes about this estimate (not visible to customer)..."
        />
        <button onClick={handleSaveNotes} disabled={savingNotes} className="btn-primary !py-2 !px-5 text-sm mt-3 disabled:opacity-60">
          {savingNotes ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}
