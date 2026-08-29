import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Receipt, Loader2, Save } from "lucide-react";
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

  if (!estimate) {
    return (
      <div className="py-12 text-center text-brand-muted">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
        <span>Loading estimate details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/admin/estimates" className="inline-flex items-center gap-1.5 text-sm text-brand-primary font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Estimates</span>
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Estimate Number</span>
          <h1 className="font-display text-2xl font-bold text-brand-navy">{estimate.estimateNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-muted font-medium">Status:</span>
          <select
            value={estimate.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold bg-white focus:outline-none focus:border-brand-primary"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card-surface p-5 rounded-2xl border border-brand-border/80 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-brand-primary">
            <User className="w-4 h-4" />
            <h2 className="font-display font-semibold text-brand-navy">Customer Details</h2>
          </div>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-brand-muted">Name</dt><dd className="font-medium text-brand-navy">{estimate.customer?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-muted">Phone</dt><dd className="font-medium text-brand-navy">{estimate.customer?.phone}</dd></div>
            {estimate.customer?.email && <div className="flex justify-between"><dt className="text-brand-muted">Email</dt><dd className="font-medium text-brand-navy">{estimate.customer.email}</dd></div>}
            <div className="flex justify-between"><dt className="text-brand-muted">City</dt><dd className="font-medium text-brand-navy">{estimate.customer?.city}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-muted">State</dt><dd className="font-medium text-brand-navy">{estimate.customer?.state}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-muted">Pincode</dt><dd className="font-medium text-brand-navy">{estimate.customer?.pincode}</dd></div>
          </dl>
          <div className="mt-3 pt-3 border-t border-brand-border">
            <p className="text-xs text-brand-muted">Delivery Address:</p>
            <p className="text-sm text-brand-navy mt-0.5">{estimate.customer?.address}</p>
          </div>
        </div>

        <div className="card-surface p-5 rounded-2xl border border-brand-border/80 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-brand-primary">
            <Receipt className="w-4 h-4" />
            <h2 className="font-display font-semibold text-brand-navy">Financial Summary</h2>
          </div>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-brand-muted">Subtotal</dt><dd className="font-medium">{formatCurrency(estimate.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-muted">Total Savings</dt><dd className="text-brand-success font-medium">-{formatCurrency(estimate.totalDiscount)}</dd></div>
            <div className="flex justify-between font-bold text-brand-navy text-base border-t border-brand-border pt-2 mt-1">
              <dt>Estimated Total</dt><dd className="text-brand-primary-dark">{formatCurrency(estimate.estimatedTotal)}</dd>
            </div>
            <div className="flex justify-between text-xs text-brand-muted pt-2 border-t border-brand-border">
              <dt>Submitted Date</dt><dd>{new Date(estimate.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card-surface overflow-hidden border border-brand-border/80 rounded-2xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50 text-brand-muted border-b border-brand-border uppercase text-[11px] tracking-wider font-semibold">
              <th className="py-3 px-4">Product Item</th>
              <th className="py-3 px-4 text-center">Quantity</th>
              <th className="py-3 px-4">Unit Price</th>
              <th className="py-3 px-4 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/60">
            {estimate.items?.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-4">
                  <p className="font-semibold text-brand-navy">{item.productNameEn}</p>
                  <p className="text-xs text-brand-muted">{item.productCode} · {item.unit}</p>
                </td>
                <td className="py-3 px-4 text-center font-semibold">{item.quantity}</td>
                <td className="py-3 px-4">{formatCurrency(item.discountedUnitPrice ?? item.originalUnitPrice)}</td>
                <td className="py-3 px-4 text-right font-bold text-brand-navy">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-surface p-5 rounded-2xl border border-brand-border/80 shadow-sm">
        <h2 className="font-display font-semibold text-brand-navy mb-2">Admin Notes & Follow-up</h2>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
          placeholder="Internal notes about this estimate (e.g. called customer on WhatsApp, quoted bulk delivery discount)..."
        />
        <button
          onClick={handleSaveNotes}
          disabled={savingNotes}
          className="btn-primary !py-2 !px-5 text-sm mt-3 flex items-center gap-2 disabled:opacity-60"
        >
          {savingNotes ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Notes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
