import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CategoryService, ProductService, SettingsService } from "../services/api";
import { DEFAULT_THEME } from "./theme";

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

async function ensureTamilFontReady() {
  if (!document?.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load('600 14px "Noto Sans Tamil"'),
      document.fonts.load('500 12px "Noto Sans Tamil"'),
      document.fonts.ready,
    ]);
  } catch {
    // Best effort only. The canvas renderer will still attempt a fallback font.
  }
}

const tamilImageCache = new Map();

function createTamilTextImage(text) {
  if (!text) return null;
  if (tamilImageCache.has(text)) return tamilImageCache.get(text);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const fontSize = 24;
  ctx.font = `600 ${fontSize}px "Noto Sans Tamil", sans-serif`;
  const width = Math.max(Math.ceil(ctx.measureText(text).width) + 12, 24);
  const height = 34;

  canvas.width = width;
  canvas.height = height;

  const drawCtx = canvas.getContext("2d");
  if (!drawCtx) return null;
  drawCtx.font = `600 ${fontSize}px "Noto Sans Tamil", sans-serif`;
  drawCtx.fillStyle = "#1f2937";
  drawCtx.textBaseline = "middle";
  drawCtx.fillText(text, 6, height / 2 + 1);

  const image = {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  };
  tamilImageCache.set(text, image);
  return image;
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
        content: `${group.category.nameEn.toUpperCase()}${group.category.nameTa ? `  •  ${group.category.nameTa}` : ""}`,
        colSpan: 7,
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
    await ensureTamilFontReady();

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

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

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
        if (data.section !== "body" || data.column.index !== 2) return;
        const tamilText = data.cell.raw?.tamilText;
        if (!tamilText) return;

        const image = createTamilTextImage(tamilText);
        if (!image) return;

        const maxWidth = Math.max(data.cell.width - 3, 1);
        const maxHeight = Math.max(data.cell.height - 2, 1);
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const x = data.cell.x + 1.5;
        const y = data.cell.y + (data.cell.height - drawHeight) / 2;

        try {
          doc.addImage(image.dataUrl, "PNG", x, y, drawWidth, drawHeight);
        } catch {
          // Leave the cell blank if embedding fails.
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
