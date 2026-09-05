import { useTranslation } from "react-i18next";

function buildVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("left-ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("right-ellipsis");
  pages.push(totalPages);

  return pages;
}

export default function Pagination({ page, total, pageSize = 10, onPageChange, className = "" }) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = buildVisiblePages(page, totalPages);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 pt-5 ${className}`.trim()}>
      <p className="text-sm text-brand-muted">
        {t("pagination.showingPage", { page, total: totalPages })}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("pagination.previous")}
        </button>

        <div className="flex items-center gap-2">
          {pages.map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition-all ${
                  page === item
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                    : "border border-brand-border bg-white text-brand-navy hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="px-1 text-brand-muted">
                ...
              </span>
            )
          )}
        </div>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("pagination.next")}
        </button>
      </div>
    </div>
  );
}
