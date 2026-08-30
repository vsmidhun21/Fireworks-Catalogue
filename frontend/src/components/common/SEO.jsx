import { useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";

/**
 * Minimal, dependency-free per-page SEO helper. Sets document title and
 * updates (then restores) the meta description / Open Graph tags for the
 * lifetime of the page. Avoids pulling in react-helmet just for this.
 */
export default function SEO({ title, description }) {
  const { settings } = useSettings();
  const businessName = settings.business_name || "Sri RR Crackers";

  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = title ? `${title} | ${businessName}` : document.title;
    document.title = fullTitle;

    const descTag = document.querySelector('meta[name="description"]');
    const prevDesc = descTag?.getAttribute("content");
    if (description && descTag) descTag.setAttribute("content", description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const prevOgTitle = ogTitle?.getAttribute("content");
    if (title && ogTitle) ogTitle.setAttribute("content", fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    const prevOgDesc = ogDesc?.getAttribute("content");
    if (description && ogDesc) ogDesc.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      if (descTag && prevDesc != null) descTag.setAttribute("content", prevDesc);
      if (ogTitle && prevOgTitle != null) ogTitle.setAttribute("content", prevOgTitle);
      if (ogDesc && prevOgDesc != null) ogDesc.setAttribute("content", prevOgDesc);
    };
  }, [title, description, businessName]);

  return null;
}
