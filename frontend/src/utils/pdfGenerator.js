import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CategoryService, ProductService, SettingsService } from "../services/api";
import { DEFAULT_THEME } from "./theme";

// Real, embedded Unicode Tamil font (not the OS's fonts, not a canvas/image
// rasterization) so Tamil category/product names render as genuine,
// selectable text in the generated PDF instead of Latin-only jsPDF glyphs.
const TAMIL_FONT_NAME = "NotoSansTamil";
let tamilFontRegistered = false;

async function ensureTamilFontEmbedded(doc) {
  if (!tamilFontRegistered) {
    const [{ NotoSansTamilRegular }, { NotoSansTamilBold }] = await Promise.all([
      import("../assets/fonts/NotoSansTamil-Regular.js"),
      import("../assets/fonts/NotoSansTamil-Bold.js"),
    ]);
    doc.addFileToVFS("NotoSansTamil-Regular.ttf", NotoSansTamilRegular);
    doc.addFont("NotoSansTamil-Regular.ttf", TAMIL_FONT_NAME, "normal");
    doc.addFileToVFS("NotoSansTamil-Bold.ttf", NotoSansTamilBold);
    doc.addFont("NotoSansTamil-Bold.ttf", TAMIL_FONT_NAME, "bold");
    tamilFontRegistered = true;
  }
}

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function hexToRgb(hex, fallback = [15, 23, 42]) {
  if (!hex || typeof hex !== "string") return fallback;
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num) || full.length !== 6) return fallback;
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

/** Blends a color toward white by `amount` (0-1), used for soft tinted bands. */
function tint(rgb, amount) {
  return rgb.map((c) => Math.round(c + (255 - c) * amount));
}

/**
 * Draws a category band row (English name + optional Tamil name) as a single
 * centered line, mixing the Latin "helvetica" font for the English portion
 * with the embedded NotoSansTamil font for the Tamil portion so both render
 * correctly side by side. The cell's `content` is left as English-only (see
 * buildTableRows) purely so autoTable sizes/fills the cell normally; we then
 * repaint the cell here with the full bilingual line so nothing is drawn twice.
 */
function drawCategoryBand(doc, data) {
  const bandInfo = data.cell.raw?.categoryBand;
  if (!bandInfo) return;

  const cell = data.cell;
  const { nameEn, nameTa } = bandInfo;
  const fill = cell.styles.fillColor;
  const textColor = cell.styles.textColor;
  const fontSize = cell.styles.fontSize || 9.5;

  if (fill) {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.rect(cell.x, cell.y, cell.width, cell.height, "F");
  }

  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "bold");
  const engWidth = doc.getTextWidth(nameEn);

  const sep = nameTa ? "   \u2022   " : "";
  const sepWidth = sep ? doc.getTextWidth(sep) : 0;

  let tamilWidth = 0;
  if (nameTa) {
    doc.setFont(TAMIL_FONT_NAME, "normal");
    tamilWidth = doc.getTextWidth(nameTa);
  }

  const totalWidth = engWidth + sepWidth + tamilWidth;
  const centerY = cell.y + cell.height / 2;
  let x = cell.x + cell.width / 2 - totalWidth / 2;

  if (textColor) doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  doc.setFont("helvetica", "bold");
  doc.text(nameEn, x, centerY, { baseline: "middle" });
  x += engWidth;

  if (sep) {
    doc.text(sep, x, centerY, { baseline: "middle" });
    x += sepWidth;
  }

  if (nameTa) {
    doc.setFont(TAMIL_FONT_NAME, "normal");
    doc.text(nameTa, x, centerY, { baseline: "middle" });
  }

  doc.setFont("helvetica", "normal");
}

/** Draws a product's Tamil name using the embedded Tamil font as real vector text. */
function drawProductTamilName(doc, data) {
  const tamilText = data.cell.raw?.tamilText;
  if (!tamilText) return;

  const cell = data.cell;
  const fontSize = cell.styles.fontSize || 7.4;
  const textColor = cell.styles.textColor || [30, 41, 59];

  doc.setFont(TAMIL_FONT_NAME, "normal");
  doc.setFontSize(Math.max(fontSize, 8.2));
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(tamilText, cell.x + 1.5, cell.y + cell.height / 2, { baseline: "middle" });
  doc.setFont("helvetica", "normal");
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildTableRows(groups, accentRgb) {
  const rows = [];
  const bandColor = tint(accentRgb, 0.86);
  const bandText = accentRgb.map((c) => Math.round(c * 0.55));

  for (const group of groups) {
    if (!group.items.length) continue;

    rows.push([
      {
        // Content is English-only so autoTable sizes/fills this cell the
        // same way it always has; the full bilingual line (English + Tamil)
        // is then drawn over it in didDrawCell via drawCategoryBand().
        content: group.category.nameEn.toUpperCase(),
        colSpan: 7,
        categoryBand: {
          nameEn: group.category.nameEn.toUpperCase(),
          nameTa: group.category.nameTa || "",
        },
        styles: {
          fillColor: bandColor,
          textColor: bandText,
          fontStyle: "bold",
          halign: "center",
          fontSize: 9.5,
          cellPadding: 2.2,
        },
      },
    ]);

    group.items.forEach((product) => {
      const hasDiscount = product.discountedPrice != null && product.discountedPrice < product.originalPrice;
      rows.push([
        product.productCode || "-",
        product.nameEn || "",
        { content: "", tamilText: product.nameTa || "" },
        formatPrice(product.originalPrice),
        product.unit || "Box",
        {
          content: formatPrice(product.discountedPrice ?? product.originalPrice),
          styles: hasDiscount ? { textColor: [21, 128, 61] } : {},
        },
        "",
      ]);
    });
  }

  return rows;
}

export async function downloadPriceListPDF(options = {}) {
  const { onProgress } = options;

  if (onProgress) onProgress(true);

  try {
    const currentYear = new Date().getFullYear();
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    await ensureTamilFontEmbedded(doc);

    const [catRes, prodRes, settingsRes] = await Promise.all([
      CategoryService.list(),
      ProductService.list({ limit: 1000 }),
      SettingsService.public(),
    ]);

    const categories = catRes.data || [];
    const products = prodRes.data?.items || [];
    const settings = settingsRes.data || {};
    const logoImg = await loadImage(settings.logo_url || "/images/logo.png");

    // Brand colors come straight from Admin -> Settings -> Branding, so the
    // PDF always matches whatever the live website currently looks like.
    const primaryRgb = hexToRgb(settings.theme_primary_color || DEFAULT_THEME.theme_primary_color, [91, 33, 182]);
    const darkRgb = hexToRgb(settings.theme_dark_color || DEFAULT_THEME.theme_dark_color, [15, 23, 42]);
    const goldRgb = hexToRgb(settings.theme_gold_color || DEFAULT_THEME.theme_gold_color, [245, 158, 11]);
    const accentRgb = hexToRgb(settings.theme_secondary_color || DEFAULT_THEME.theme_secondary_color, [249, 115, 22]);

    const categoryIds = new Set(categories.map((category) => category.id));
    const groupedCategories = categories
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((category) => ({
        category,
        items: products
          .filter((product) => product.categoryId === category.id)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      }));

    const uncategorized = products.filter((product) => !categoryIds.has(product.categoryId));
    if (uncategorized.length) {
      groupedCategories.push({
        category: { nameEn: "Other Products", nameTa: "" },
        items: uncategorized,
      });
    }

    const totalActiveProducts = products.length;
    const totalCategories = groupedCategories.filter((g) => g.items.length).length;

    const businessName = settings.business_name || "Sri RR Crackers";
    const tagline = settings.site_tagline || "Premium Fireworks Catalogue & Estimate";
    const phoneNumbers = [settings.phone_primary, settings.phone_secondary]
      .filter(Boolean)
      .map((phone) => String(phone).trim());
    const whatsappNumber = settings.whatsapp_number ? String(settings.whatsapp_number).trim() : "";
    const addressLines = [settings.address, settings.business_hours].filter(Boolean);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const HEADER_HEIGHT = 46;
    const FOOTER_Y = pageHeight - 12;
    const tableBody = buildTableRows(groupedCategories, accentRgb);

    function drawHeader() {
      // Dark brand-color header band
      doc.setFillColor(...darkRgb);
      doc.rect(0, 0, pageWidth, HEADER_HEIGHT, "F");

      // Thin gold accent line under the header for a premium finish
      doc.setFillColor(...goldRgb);
      doc.rect(0, HEADER_HEIGHT, pageWidth, 1.4, "F");

      if (logoImg) {
        try {
          // White rounded chip behind the logo so it reads clearly on any brand color
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(10, 9, 20, 20, 3, 3, "F");
          doc.addImage(logoImg, "PNG", 12, 11, 16, 16);
        } catch {
          // Continue with text-only header.
        }
      }

      const textX = logoImg ? 36 : 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(255, 255, 255);
      doc.text(businessName.toUpperCase(), textX, 17);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(226, 232, 240);
      doc.text(tagline, textX, 23);

      doc.setFontSize(7.3);
      doc.setTextColor(203, 213, 225);
      if (addressLines[0]) doc.text(addressLines[0], textX, 28.5, { maxWidth: pageWidth - textX - 60 });
      if (addressLines[1]) doc.text(addressLines[1], textX, 33, { maxWidth: pageWidth - textX - 60 });

      // Right-aligned contact block
      let rightY = 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...goldRgb.map((c) => Math.min(255, c + 40)));
      doc.text("RETAIL PRICE LIST", pageWidth - 10, rightY, { align: "right" });
      rightY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(String(currentYear), pageWidth - 10, rightY, { align: "right" });
      rightY += 5.5;

      doc.setFontSize(7.3);
      doc.setTextColor(226, 232, 240);
      phoneNumbers.slice(0, 2).forEach((phone) => {
        doc.text(`Tel: ${phone}`, pageWidth - 10, rightY, { align: "right" });
        rightY += 4;
      });
      if (whatsappNumber) {
        const display = whatsappNumber.startsWith("91") ? `+${whatsappNumber}` : whatsappNumber;
        doc.text(`WhatsApp: ${display}`, pageWidth - 10, rightY, { align: "right" });
      }

      // Summary strip: total categories / products / generated date
      const stripY = HEADER_HEIGHT + 6;
      doc.setFillColor(...tint(primaryRgb, 0.93));
      doc.roundedRect(8, stripY, pageWidth - 16, 8.5, 2.5, 2.5, "F");
      doc.setDrawColor(...tint(primaryRgb, 0.7));
      doc.setLineWidth(0.2);
      doc.roundedRect(8, stripY, pageWidth - 16, 8.5, 2.5, 2.5, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...primaryRgb.map((c) => Math.round(c * 0.7)));
      const summaryText = `${totalCategories} Categories   -   ${totalActiveProducts} Products   -   Prices in Indian Rupees (Rs.)`;
      doc.text(summaryText, pageWidth / 2, stripY + 5.6, { align: "center" });

      return stripY + 8.5 + 4;
    }

    const tableStartY = HEADER_HEIGHT + 6 + 8.5 + 4;

    autoTable(doc, {
      startY: tableStartY,
      margin: { top: HEADER_HEIGHT + 6, left: 8, right: 8, bottom: 16 },
      head: [
        [
          { content: "Code", styles: { halign: "center" } },
          { content: "Product Name", styles: { halign: "left" } },
          { content: "Tamil Name", styles: { halign: "left" } },
          { content: "MRP (Rs.)", styles: { halign: "right" } },
          { content: "Unit", styles: { halign: "center" } },
          { content: "Offer Price (Rs.)", styles: { halign: "right" } },
          { content: "Qty", styles: { halign: "center" } },
        ],
      ],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: darkRgb,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        lineWidth: 0.15,
        lineColor: tint(darkRgb, 0.3),
        cellPadding: 2.2,
      },
      styles: {
        font: "helvetica",
        fontSize: 7.4,
        cellPadding: 1.6,
        lineWidth: 0.1,
        lineColor: [222, 226, 232],
        textColor: [30, 41, 59],
        overflow: "linebreak",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center", fontStyle: "bold", textColor: primaryRgb },
        1: { cellWidth: 48, halign: "left" },
        2: { cellWidth: 43, halign: "left", minCellHeight: 8 },
        3: { cellWidth: 19, halign: "right" },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 25, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 14, halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      didDrawCell: (data) => {
        if (data.section !== "body") return;
        if (data.cell.raw?.categoryBand) {
          drawCategoryBand(doc, data);
          return;
        }
        if (data.column.index === 2) {
          drawProductTamilName(doc, data);
        }
      },
      didDrawPage: () => {
        drawHeader();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(120, 130, 145);
        doc.setDrawColor(...tint(darkRgb, 0.75));
        doc.setLineWidth(0.15);
        doc.line(8, FOOTER_Y - 3.5, pageWidth - 8, FOOTER_Y - 3.5);

        doc.text(
          `${businessName} - Price list generated on ${new Date().toLocaleDateString("en-IN")}`,
          8,
          FOOTER_Y
        );
        if (whatsappNumber) {
          doc.text(
            `Order enquiries: WhatsApp ${whatsappNumber.startsWith("91") ? `+${whatsappNumber}` : whatsappNumber}`,
            pageWidth / 2,
            FOOTER_Y,
            { align: "center" }
          );
        }
      },
    });

    // ---- Second pass: stamp "Page X of Y" on every page now that the
    // total page count is known. ----
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(120, 130, 145);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 8, FOOTER_Y, { align: "right" });
    }

    doc.save(`${businessName.replace(/\s+/g, "_")}_Price_List_${currentYear}.pdf`);
    return true;
  } catch (error) {
    console.error("Failed to generate Price List PDF:", error);
    throw error;
  } finally {
    if (onProgress) onProgress(false);
  }
}
