import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CategoryService, ProductService, SettingsService } from "../services/api";

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
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

function buildTableRows(groups) {
  const rows = [];

  for (const group of groups) {
    if (!group.items.length) continue;

    rows.push([
      {
        content: `${group.category.nameEn.toUpperCase()}${group.category.nameTa ? ` - ${group.category.nameTa}` : ""}`,
        colSpan: 7,
        styles: {
          fillColor: [255, 237, 213],
          textColor: [124, 45, 18],
          fontStyle: "bold",
          halign: "center",
          fontSize: 9,
          cellPadding: 1.8,
        },
      },
    ]);

    group.items.forEach((product) => {
      rows.push([
        product.productCode || "-",
        product.nameEn || "",
        { content: "", tamilText: product.nameTa || "" },
        formatPrice(product.originalPrice),
        product.unit || "Box",
        formatPrice(product.discountedPrice ?? product.originalPrice),
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

    const [catRes, prodRes, settingsRes, logoImg] = await Promise.all([
      CategoryService.list(),
      ProductService.list({ limit: 1000 }),
      SettingsService.public(),
      loadImage("/images/logo.png"),
    ]);

    const categories = catRes.data || [];
    const products = prodRes.data?.items || [];
    const settings = settingsRes.data || {};

    const categoryIds = new Set(categories.map((category) => category.id));
    const groupedCategories = categories.map((category) => ({
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

    const businessName = settings.business_name || "Sri RR Crackers";
    const phoneNumbers = [settings.phone_primary, settings.phone_secondary, settings.whatsapp_number]
      .filter(Boolean)
      .map((phone) => String(phone).trim());
    const addressLines = [settings.address, settings.business_hours].filter(Boolean);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const tableBody = buildTableRows(groupedCategories);

    autoTable(doc, {
      startY: 48,
      margin: { top: 48, left: 8, right: 8, bottom: 14 },
      head: [
        [
          { content: "Code", styles: { halign: "center" } },
          { content: "Product Name", styles: { halign: "left" } },
          { content: "Tamil Name", styles: { halign: "left" } },
          { content: "MRP", styles: { halign: "right" } },
          { content: "Unit", styles: { halign: "center" } },
          { content: "Offer Price", styles: { halign: "right" } },
          { content: "Qty", styles: { halign: "center" } },
        ],
      ],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [14, 116, 144],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        lineWidth: 0.15,
        lineColor: [186, 230, 253],
        cellPadding: 2,
      },
      styles: {
        fontSize: 7.4,
        cellPadding: 1.5,
        lineWidth: 0.1,
        lineColor: [203, 213, 225],
        textColor: [15, 23, 42],
        overflow: "linebreak",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 49, halign: "left" },
        2: { cellWidth: 44, halign: "left", minCellHeight: 8 },
        3: { cellWidth: 18, halign: "right" },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 14, halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
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
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFillColor(15, 23, 42);
        doc.roundedRect(8, 8, pageWidth - 16, 24, 4, 4, "F");

        if (logoImg) {
          try {
            doc.addImage(logoImg, "PNG", 12, 11, 16, 16);
          } catch {
            // Continue with text-only header.
          }
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(255, 255, 255);
        doc.text(businessName.toUpperCase(), 32, 16);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(226, 232, 240);
        doc.text(`Retail Price List ${currentYear}`, 32, 21);
        if (addressLines[0]) doc.text(addressLines[0], 32, 25.5);
        if (addressLines[1]) doc.text(addressLines[1], 32, 29);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(253, 224, 71);
        doc.text("Factory-direct festive pricing", pageWidth - 12, 15, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setTextColor(255, 255, 255);
        phoneNumbers.slice(0, 3).forEach((phone, index) => {
          doc.text(phone.startsWith("91") ? `+${phone}` : phone, pageWidth - 12, 20 + index * 4, { align: "right" });
        });

        doc.setFillColor(255, 247, 237);
        doc.roundedRect(8, 35, pageWidth - 16, 9, 3, 3, "F");
        doc.setDrawColor(251, 146, 60);
        doc.setLineWidth(0.3);
        doc.line(10, 43.5, pageWidth - 10, 43.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(154, 52, 18);
        doc.text("Products, codes, Tamil names, and current offer prices", pageWidth / 2, 40.8, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `${businessName} - Price list generated on ${new Date().toLocaleDateString("en-IN")} - Page ${pageNumber}`,
          8,
          pageHeight - 6
        );
      },
    });

    doc.save(`${businessName.replace(/\s+/g, "_")}_Price_List_${currentYear}.pdf`);
    return true;
  } catch (error) {
    console.error("Failed to generate Price List PDF:", error);
    throw error;
  } finally {
    if (onProgress) onProgress(false);
  }
}
