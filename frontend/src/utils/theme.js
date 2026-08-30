// Applies the business's brand colors (set in Admin → Settings → Branding)
// as CSS custom properties on the document root at runtime.
//
// Because index.css defines the palette inside a Tailwind v4 `@theme` block
// (e.g. `--color-brand-primary: #5B21B6;`), every `bg-brand-primary`,
// `text-brand-primary`, `border-brand-primary`, etc. utility class compiles
// down to `var(--color-brand-primary)`. Overriding that variable on
// `document.documentElement` after settings load therefore re-colors the
// entire site instantly — no rebuild, no page reload, no per-component work.

export const DEFAULT_THEME = {
  theme_primary_color: "#5B21B6", // brand-primary (buttons, links, accents)
  theme_secondary_color: "#F97316", // brand-orange (CTAs, highlights)
  theme_dark_color: "#101828", // brand-navy (header/footer/dark sections)
  theme_gold_color: "#F59E0B", // brand-gold (festive highlights, badges)
};

const VARIABLE_MAP = {
  theme_primary_color: ["--color-brand-primary"],
  theme_secondary_color: ["--color-brand-orange"],
  theme_dark_color: ["--color-brand-navy"],
  theme_gold_color: ["--color-brand-gold"],
};

/** Returns a darker shade of a hex color (used to derive hover/dark variants). */
export function shadeHexColor(hex, percent) {
  if (!hex || typeof hex !== "string") return hex;
  const clean = hex.replace("#", "");
  if (![3, 6].includes(clean.length)) return hex;
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.max(0, Math.min(255, Math.round(r + (percent < 0 ? r : 255 - r) * (percent / 100))));
  g = Math.max(0, Math.min(255, Math.round(g + (percent < 0 ? g : 255 - g) * (percent / 100))));
  b = Math.max(0, Math.min(255, Math.round(b + (percent < 0 ? b : 255 - b) * (percent / 100))));

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function applyTheme(settings = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  Object.entries(VARIABLE_MAP).forEach(([settingKey, cssVars]) => {
    const value = settings[settingKey] || DEFAULT_THEME[settingKey];
    cssVars.forEach((cssVar) => root.style.setProperty(cssVar, value));
  });

  const primary = settings.theme_primary_color || DEFAULT_THEME.theme_primary_color;
  root.style.setProperty("--color-brand-primary-dark", shadeHexColor(primary, -18));
}

/** Updates the browser tab title, meta description and favicon from settings. */
export function applySiteMeta(settings = {}) {
  if (typeof document === "undefined") return;

  const businessName = settings.business_name || "Sri RR Crackers";
  const tagline = settings.site_tagline || "Premium Fireworks Catalogue & Estimate";
  document.title = `${businessName} — ${tagline}`;

  const descriptionTag = document.querySelector('meta[name="description"]');
  if (descriptionTag) {
    descriptionTag.setAttribute(
      "content",
      `${businessName} — ${tagline}. Browse our catalogue and request an estimate online.`
    );
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", businessName);

  if (settings.logo_url) {
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = settings.logo_url;
  }
}
