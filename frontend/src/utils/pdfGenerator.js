import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CategoryService, ProductService, SettingsService } from "../services/api";
import { DEFAULT_THEME } from "./theme";

// Real, embedded Unicode Tamil font (not the OS's fonts, not a canvas/image
// rasterization) so Tamil category/product names render as genuine,
// selectable text in the generated PDF instead of Latin-only jsPDF glyphs.
const TAMIL_FONT_NAME = "NotoSerifTamil";
const tamilFontsRegisteredFor = new WeakSet();
const TAMIL_MM_TO_PX = 96 / 25.4;
const TAMIL_IMAGE_SCALE = 4;
let tamilRegularFontData = "";
let tamilCanvasFontReady = false;

async function ensureTamilFontEmbedded(doc) {
  if (!tamilFontsRegisteredFor.has(doc)) {
    const [{ NotoSerifTamilRegular }, { NotoSerifTamilBold }] = await Promise.all([
      import("../assets/fonts/NotoSerifTamil-Regular.js"),
      import("../assets/fonts/NotoSerifTamil-Bold.js"),
    ]);
    tamilRegularFontData = NotoSerifTamilRegular;
    doc.addFileToVFS("NotoSerifTamil-Regular.ttf", NotoSerifTamilRegular);
    doc.addFont("NotoSerifTamil-Regular.ttf", TAMIL_FONT_NAME, "normal");
    doc.addFileToVFS("NotoSerifTamil-Bold.ttf", NotoSerifTamilBold);
    doc.addFont("NotoSerifTamil-Bold.ttf", TAMIL_FONT_NAME, "bold");
    tamilFontsRegisteredFor.add(doc);
  }

  if (!tamilCanvasFontReady && typeof FontFace !== "undefined" && typeof document !== "undefined") {
    const fontFace = new FontFace(TAMIL_FONT_NAME, `url(data:font/ttf;base64,${tamilRegularFontData})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    tamilCanvasFontReady = true;
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

function compareProductsByCode(a, b) {
  const codeDifference = Number(a.productCode) - Number(b.productCode);
  if (Number.isFinite(codeDifference) && codeDifference !== 0) return codeDifference;
  return Number(a.id) - Number(b.id);
}

function getTamilCanvasContext(fontSize) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${fontSize * (96 / 72)}px "${TAMIL_FONT_NAME}"`;
  return context;
}

function getTamilTextWidth(text, fontSize) {
  return getTamilCanvasContext(fontSize).measureText(text).width / TAMIL_MM_TO_PX;
}

function drawTamilImage(doc, text, x, centerY, fontSize, color) {
  if (!text) return;

  const fontPx = fontSize * (96 / 72);
  const context = getTamilCanvasContext(fontSize);
  const paddingPx = 4;
  const widthPx = Math.ceil(context.measureText(text).width + paddingPx * 2);
  const heightPx = Math.ceil(fontPx * 1.45 + paddingPx * 2);
  const canvas = document.createElement("canvas");
  canvas.width = widthPx * TAMIL_IMAGE_SCALE;
  canvas.height = heightPx * TAMIL_IMAGE_SCALE;
  const imageContext = canvas.getContext("2d");
  imageContext.scale(TAMIL_IMAGE_SCALE, TAMIL_IMAGE_SCALE);
  imageContext.font = context.font;
  imageContext.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  imageContext.textBaseline = "middle";
  imageContext.fillText(text, paddingPx, heightPx / 2);

  doc.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    x,
    centerY - heightPx / TAMIL_MM_TO_PX / 2,
    widthPx / TAMIL_MM_TO_PX,
    heightPx / TAMIL_MM_TO_PX,
    undefined,
    "FAST"
  );
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
    tamilWidth = getTamilTextWidth(nameTa, Math.max(fontSize, 8.2));
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
    drawTamilImage(doc, nameTa, x, centerY, Math.max(fontSize, 8.2), textColor || [30, 41, 59]);
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

  drawTamilImage(doc, tamilText, cell.x + 1.5, cell.y + cell.height / 2, Math.max(fontSize, 8.2), textColor);
  doc.setFont("helvetica", "normal");
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---- Layout constants shared between row-height estimation and the actual
// autoTable configuration below. Keeping a single source of truth here is
// what lets buildTableRows() simulate pagination accurately enough to avoid
// orphaned category headings, without duplicating magic numbers. ----
const COLUMN_WIDTHS = [15, 55, 50, 19, 18, 25]; // mm, matches columnStyles
const PRODUCT_NAME_COLUMN = 1;
const BODY_FONT_SIZE = 7.4;
const BODY_CELL_PADDING = 1.6;
const BODY_MIN_ROW_HEIGHT = 8; // matches column 2's minCellHeight
const BAND_FONT_SIZE = 9.5;
const BAND_CELL_PADDING = 2.2;
const LINE_HEIGHT_FACTOR = 1.15;
const MM_PER_PT = 0.3528;

/** Conservative text-block height in mm for `lines` lines at `fontSize` pt, plus vertical padding. */
function estimateTextBlockHeight(lines, fontSize, cellPadding) {
  const lineHeightMm = fontSize * MM_PER_PT * LINE_HEIGHT_FACTOR;
  return cellPadding * 2 + Math.max(1, lines) * lineHeightMm;
}

/**
 * Estimates a rendered product row's height, accounting for product-name
 * wrapping. This must stay an *unpadded*, best-effort match of autoTable's
 * own Cell.getContentHeight() formula (same line-height/padding constants) -
 * adding a fixed "safety buffer" here would compound across every row over
 * a multi-page table and make the running total drift far from reality.
 */
function estimateProductRowHeight(doc, product) {
  const availableWidth = COLUMN_WIDTHS[PRODUCT_NAME_COLUMN] - BODY_CELL_PADDING * 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_FONT_SIZE);
  const wrapped = doc.splitTextToSize(product.nameEn || "", availableWidth);
  const textHeight = estimateTextBlockHeight(wrapped.length, BODY_FONT_SIZE, BODY_CELL_PADDING);
  return Math.max(BODY_MIN_ROW_HEIGHT, textHeight);
}

/** Estimates a category band row's height (always a single centered line). */
function estimateBandRowHeight() {
  return estimateTextBlockHeight(1, BAND_FONT_SIZE, BAND_CELL_PADDING);
}

const TABLE_HEAD_LABELS = ["Code", "Product Name", "Tamil Name", "MRP (Rs.)", "Unit", "Offer Price (Rs.)"];
const HEAD_FONT_SIZE = 8.5;
const HEAD_CELL_PADDING = 2.2;

/**
 * Estimates the repeated table-header row's real height by checking how many
 * lines each header label wraps to in its own column (e.g. "Offer Price
 * (Rs.)" wraps to 2 lines in its 25mm column) - getting this right matters
 * because it's added to the simulated cursor every time a new page starts.
 */
function estimateHeadRowHeight(doc) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(HEAD_FONT_SIZE);
  const maxLines = TABLE_HEAD_LABELS.reduce((max, label, i) => {
    const availableWidth = COLUMN_WIDTHS[i] - HEAD_CELL_PADDING * 2;
    const wrapped = doc.splitTextToSize(label, availableWidth);
    return Math.max(max, wrapped.length);
  }, 1);
  return estimateTextBlockHeight(maxLines, HEAD_FONT_SIZE, HEAD_CELL_PADDING);
}

// Small, fixed safety margin used only when deciding whether a heading would
// be orphaned (never added to the running cumulative total - see comment
// above). This tightens (not loosens) the available-space check so a
// genuinely borderline fit - like a row that's short by a fraction of a
// millimetre - is treated as "won't fit" rather than being risked.
const ORPHAN_CHECK_SAFETY_MARGIN = 2.5;

function buildTableRows(doc, groups, accentRgb, layout) {
  const rows = [];
  const bandColor = tint(accentRgb, 0.86);
  const bandText = accentRgb.map((c) => Math.round(c * 0.55));
  const { tableStartY, marginTop, pageBottom, headHeight } = layout;

  // Simulated running cursor, mirroring how autoTable will actually paginate,
  // so we can detect a category heading that would otherwise be printed with
  // no room left for a single product row beneath it (an "orphaned" heading).
  // Starts after the table's own header row, exactly like the real table.
  let simulatedY = tableStartY + headHeight;

  function simulateAdvance(height) {
    if (simulatedY + height > pageBottom) {
      simulatedY = marginTop + headHeight;
    }
    simulatedY += height;
  }

  for (const group of groups) {
    if (!group.items.length) continue;

    const bandHeight = estimateBandRowHeight();
    const firstRowHeight = estimateProductRowHeight(doc, group.items[0]);

    // Would the heading alone still fit on the current page, but leave no
    // room for the first product row underneath it? If so, insert an
    // invisible spacer row that exactly fills the remaining space, which
    // makes autoTable's own page-break logic naturally start this category
    // on a fresh page (with the table header correctly repeated), instead of
    // us manually drawing anything at fixed coordinates.
    const fitsAlone = simulatedY + bandHeight <= pageBottom - ORPHAN_CHECK_SAFETY_MARGIN;
    const fitsWithFirstRow = simulatedY + bandHeight + firstRowHeight <= pageBottom - ORPHAN_CHECK_SAFETY_MARGIN;
    if (fitsAlone && !fitsWithFirstRow) {
      const spacerHeight = Math.max(pageBottom - simulatedY, 0.01);
      rows.push([
        {
          content: "",
          colSpan: 6,
          styles: {
            minCellHeight: spacerHeight,
            fillColor: false,
            lineWidth: 0,
          },
        },
      ]);
      simulatedY = marginTop + headHeight;
    }

    rows.push([
      {
        // Content is English-only so autoTable sizes/fills this cell the
        // same way it always has; the full bilingual line (English + Tamil)
        // is then drawn over it in didDrawCell via drawCategoryBand().
        content: group.category.nameEn.toUpperCase(),
        colSpan: 6,
        categoryBand: {
          nameEn: group.category.nameEn.toUpperCase(),
          nameTa: group.category.nameTa || "",
        },
        styles: {
          fillColor: bandColor,
          textColor: bandText,
          fontStyle: "bold",
          halign: "center",
          fontSize: BAND_FONT_SIZE,
          cellPadding: BAND_CELL_PADDING,
        },
      },
    ]);
    simulateAdvance(bandHeight);

    group.items.forEach((product) => {
      const discPrice = product.discountedPrice != null ? product.discountedPrice : Math.round(product.originalPrice * 0.10);
      const hasDiscount = discPrice < product.originalPrice;
      rows.push([
        product.productCode || "-",
        product.nameEn || "",
        { content: "", tamilText: product.nameTa || "" },
        formatPrice(product.originalPrice),
        product.unit || "Box",
        {
          content: formatPrice(discPrice),
          styles: hasDiscount ? { textColor: [21, 128, 61] } : {},
        },
      ]);
      simulateAdvance(estimateProductRowHeight(doc, product));
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
      ProductService.list(),
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
          .sort(compareProductsByCode),
      }));

    const uncategorized = products
      .filter((product) => !categoryIds.has(product.categoryId))
      .sort(compareProductsByCode);
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
    const SUMMARY_STRIP_HEIGHT = 8.5;
    const SUMMARY_STRIP_GAP = 6; // space between header band and summary strip
    const CONTENT_TOP_GAP = 4; // space between summary strip and table
    // Full height every page must reserve at the top for drawHeader()'s brand
    // band + summary strip. This is the single source of truth for where the
    // table (and its repeated header row) may safely start on ANY page -
    // using one value everywhere is what prevents the table from starting
    // underneath the header on page 2+.
    const HEADER_RESERVED_HEIGHT = HEADER_HEIGHT + SUMMARY_STRIP_GAP + SUMMARY_STRIP_HEIGHT + CONTENT_TOP_GAP;
    const BOTTOM_MARGIN = 20; // comfortable clearance above the footer text/line
    const FOOTER_Y = pageHeight - 12;
    const tableStartY = HEADER_RESERVED_HEIGHT;
    const pageBottom = pageHeight - BOTTOM_MARGIN;
    // Real repeated-header-row height (accounts for labels like "Offer Price
    // (Rs.)" wrapping to 2 lines in their column) - used to simulate
    // pagination in buildTableRows() so the running total starts fresh pages
    // at the same point the real table does.
    const TABLE_HEAD_ROW_HEIGHT = estimateHeadRowHeight(doc);

    const tableBody = buildTableRows(doc, groupedCategories, accentRgb, {
      tableStartY,
      marginTop: tableStartY,
      pageBottom,
      headHeight: TABLE_HEAD_ROW_HEIGHT,
    });

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
      const stripY = HEADER_HEIGHT + SUMMARY_STRIP_GAP;
      doc.setFillColor(...tint(primaryRgb, 0.93));
      doc.roundedRect(8, stripY, pageWidth - 16, SUMMARY_STRIP_HEIGHT, 2.5, 2.5, "F");
      doc.setDrawColor(...tint(primaryRgb, 0.7));
      doc.setLineWidth(0.2);
      doc.roundedRect(8, stripY, pageWidth - 16, SUMMARY_STRIP_HEIGHT, 2.5, 2.5, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...primaryRgb.map((c) => Math.round(c * 0.7)));
      const summaryText = `${totalCategories} Categories  •  ${totalActiveProducts} Products  •  Flat 90% Discount  •  Min. Order Rs. 3,000`;
      doc.text(summaryText, pageWidth / 2, stripY + 5.6, { align: "center" });
    }

    autoTable(doc, {
      startY: tableStartY,
      // `margin.top` must match the space drawHeader() actually occupies
      // (HEADER_RESERVED_HEIGHT) on every page, not just the first — this is
      // what previously let page-2+ table content (including the repeated
      // header row) start underneath the brand header/summary strip.
      margin: { top: HEADER_RESERVED_HEIGHT, left: 8, right: 8, bottom: BOTTOM_MARGIN },
      // A row that doesn't fully fit on the current page is moved to the next
      // page in one piece instead of being split/clipped across the two.
      rowPageBreak: "avoid",
      head: [
        [
          { content: TABLE_HEAD_LABELS[0], styles: { halign: "center" } },
          { content: TABLE_HEAD_LABELS[1], styles: { halign: "left" } },
          { content: TABLE_HEAD_LABELS[2], styles: { halign: "left" } },
          { content: TABLE_HEAD_LABELS[3], styles: { halign: "right" } },
          { content: TABLE_HEAD_LABELS[4], styles: { halign: "center" } },
          { content: TABLE_HEAD_LABELS[5], styles: { halign: "right" } },
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
        1: { cellWidth: 55, halign: "left" },
        2: { cellWidth: 50, halign: "left", minCellHeight: 8 },
        3: { cellWidth: 19, halign: "right" },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 25, halign: "right", fontStyle: "bold" },
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
      // willDrawPage fires once at the very start of every page - including
      // page 1 - right after the cursor is reset and BEFORE that page's
      // repeated table header/rows are drawn. Drawing the brand header here
      // (instead of in didDrawPage, which fires at the END of a page, after
      // its content is already in place) is what stops the header from being
      // painted on top of already-drawn table content on page 2+.
      willDrawPage: () => {
        drawHeader();
      },
      // didDrawPage fires once at the end of every page (right before moving
      // on, or once for the final page), which is the correct place for
      // footer content.
      didDrawPage: () => {
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

export function downloadEstimatePDF(estimate) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const customer = estimate?.customer || {};
  const items = Array.isArray(estimate?.items) ? estimate.items : [];
  const businessName = "Sri RR Crackers";
  const margin = 12;
  const labelColor = [90, 90, 90];
  const textColor = [20, 20, 20];

  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(businessName, margin, 17);
  doc.setFontSize(13);
  doc.text("ESTIMATE / DELIVERY SHEET", pageWidth - margin, 17, { align: "right" });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 21, pageWidth - margin, 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Estimate No: ${estimate?.estimateNumber || "-"}`, margin, 27);
  doc.text(`Date: ${estimate?.createdAt ? new Date(estimate.createdAt).toLocaleDateString("en-IN") : "-"}`, pageWidth - margin, 27, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CUSTOMER DETAILS", margin, 37);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const customerDetails = [
    [`Name: ${customer.name || "-"}`, `Mobile: ${customer.phone || "-"}`],
    [`Additional Mobile: ${customer.alternatePhone || "-"}`, `Email: ${customer.email || "-"}`],
    [`Address: ${[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(", ") || "-"}`],
  ];
  let customerY = 43;
  customerDetails.forEach((row) => {
    row.forEach((value, index) => {
      doc.text(value, index === 0 ? margin : pageWidth / 2, customerY, { maxWidth: pageWidth / 2 - margin - 2 });
    });
    customerY += 5;
  });

  autoTable(doc, {
    startY: customerY + 4,
    margin: { left: margin, right: margin, bottom: 16 },
    head: [["Product Code", "Product", "Qty", "Unit Price", "Line Total"]],
    body: items.map((item) => [
      item.productCode || "-",
      `${item.productNameEn || "-"}${item.unit ? ` (${item.unit})` : ""}`,
      String(item.quantity ?? "-"),
      `Rs. ${Number(item.discountedUnitPrice ?? Math.round(Number(item.originalUnitPrice || 0) * 0.10)).toLocaleString("en-IN")}`,
      `Rs. ${Number(item.lineTotal || 0).toLocaleString("en-IN")}`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [235, 235, 235], textColor, fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.2 },
    styles: { font: "helvetica", fontSize: 8.5, textColor, lineColor: [120, 120, 120], lineWidth: 0.15, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 27 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 27, halign: "right" },
      4: { cellWidth: 29, halign: "right" },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  const summaryY = (doc.lastAutoTable?.finalY || customerY) + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Estimated Total: Rs. ${Number(estimate?.estimatedTotal || 0).toLocaleString("en-IN")}`, pageWidth - margin, summaryY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...labelColor);
  doc.text("Please verify item availability and final delivery details before dispatch.", margin, Math.min(summaryY + 10, pageHeight - 20));
  doc.setTextColor(...textColor);

  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...labelColor);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const fileName = String(estimate?.estimateNumber || "estimate").replace(/[^a-z0-9_-]/gi, "_");
  doc.save(`${fileName}_delivery_sheet.pdf`);
}
