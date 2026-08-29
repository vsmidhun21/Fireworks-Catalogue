import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CategoryService, ProductService } from "../services/api";

/**
 * Loads an image from URL into HTMLImageElement or Base64
 */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Generates and downloads the Sri RR Crackers Retail Price List PDF
 */
export async function downloadPriceListPDF(options = {}) {
  const { onProgress } = options;

  if (onProgress) onProgress(true);

  try {
    // 1. Fetch live categories & all products
    const [catRes, prodRes] = await Promise.all([
      CategoryService.list(),
      ProductService.list({ limit: 500 }),
    ]);

    const categories = catRes.data || [];
    const products = prodRes.data?.items || [];

    // Group products by category
    const grouped = {};
    for (const cat of categories) {
      grouped[cat.id] = {
        category: cat,
        items: [],
      };
    }

    for (const prod of products) {
      if (grouped[prod.categoryId]) {
        grouped[prod.categoryId].items.push(prod);
      } else {
        const catId = prod.categoryId || "other";
        if (!grouped[catId]) {
          grouped[catId] = {
            category: prod.category || { nameEn: "Other Crackers", nameTa: "" },
            items: [],
          };
        }
        grouped[catId].items.push(prod);
      }
    }

    // 2. Initialize jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Try loading logo
    const logoImg = await loadImage("/images/logo.png");

    // Format table body with category headers
    const tableBody = [];

    for (const catId of Object.keys(grouped)) {
      const group = grouped[catId];
      if (!group.items || group.items.length === 0) continue;

      // Category Section Header Row
      tableBody.push([
        {
          content: `${group.category.nameEn.toUpperCase()}${group.category.nameTa ? ` - ${group.category.nameTa}` : ""}`,
          colSpan: 7,
          styles: {
            fillColor: [255, 204, 188], // Peach/Orange accent matching reference PDF
            textColor: [0, 0, 0],
            fontStyle: "bold",
            halign: "center",
            fontSize: 9,
            cellPadding: 1.5,
          },
        },
      ]);

      // Category product items
      group.items.forEach((p) => {
        const original = Number(p.originalPrice || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const discounted = Number(p.discountedPrice ?? p.originalPrice).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        tableBody.push([
          p.productCode || "-",
          p.nameEn || "",
          p.nameTa || "",
          original,
          p.unit || "Box",
          discounted,
          "", // blank Qty column for customer to fill
        ]);
      });
    }

    // 3. Render autoTable
    autoTable(doc, {
      startY: 42,
      margin: { top: 44, left: 8, right: 8, bottom: 12 },
      head: [
        [
          { content: "Code", styles: { halign: "center" } },
          { content: "Name of the Product", styles: { halign: "left" } },
          { content: "Tamil Name", styles: { halign: "left" } },
          { content: "Price", styles: { halign: "right" } },
          { content: "Per", styles: { halign: "center" } },
          { content: "After Discount", styles: { halign: "right" } },
          { content: "Qty", styles: { halign: "center" } },
        ],
      ],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [77, 208, 225], // Cyan title bar matching reference PDF
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8.5,
        lineWidth: 0.2,
        lineColor: [100, 100, 100],
        cellPadding: 1.8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.2,
        lineWidth: 0.15,
        lineColor: [160, 160, 160],
        textColor: [20, 20, 20],
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 50, halign: "left" },
        2: { cellWidth: 46, halign: "left" },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: 16, halign: "center" },
        5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 14, halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [252, 252, 253],
      },
      didDrawPage: (data) => {
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

        // Top Header
        doc.saveGraphicsState();

        // 1. Spiritual top line
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text("Sri Sakthi Kaaliamman Thunai", pageWidth / 2, 6, { align: "center" });

        // 2. Logo on the left
        if (logoImg) {
          try {
            doc.addImage(logoImg, "PNG", 9, 7, 24, 24);
          } catch (e) {
            // fallback
          }
        }

        // 3. Center Business Header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 34, 61); // Navy brand
        doc.text("SRI RR CRACKERS", pageWidth / 2 + 2, 12, { align: "center" });

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);
        doc.text("(RETAILER OF SUPERIOR FANCY CRACKERS, SPARKLERS & GIFTBOXES)", pageWidth / 2 + 2, 16, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(40, 40, 40);
        doc.text("D.No : 2/557/16, Amman Tower, Southside School (Opp)", pageWidth / 2 + 2, 20, { align: "center" });
        doc.text("Chinnakamanpatti, Sivakasi - 626 189", pageWidth / 2 + 2, 23.5, { align: "center" });

        // 4. Right side phone numbers & discount badge
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 34, 61);
        doc.text("Ph: 87540 66248", pageWidth - 10, 10, { align: "right" });
        doc.text("88257 21391", pageWidth - 10, 14, { align: "right" });
        doc.text("96006 60788", pageWidth - 10, 18, { align: "right" });

        // 90% DISCOUNT BADGE on right
        doc.setFillColor(255, 236, 179); // Gold yellow badge
        doc.setDrawColor(255, 179, 0);
        doc.roundedRect(pageWidth - 32, 21, 22, 9, 1.5, 1.5, "FD");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(217, 119, 6);
        doc.text("90%", pageWidth - 21, 25.5, { align: "center" });
        doc.setFontSize(5.5);
        doc.setTextColor(180, 83, 9);
        doc.text("DISCOUNT", pageWidth - 21, 28.5, { align: "center" });

        // 5. Cyan Retail Price List Subheader Banner
        doc.setFillColor(77, 208, 225); // Cyan #4DD0E1
        doc.rect(8, 33, pageWidth - 16, 7, "F");
        doc.setFontSize(10.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("RETAIL PRICE LIST - 2025", pageWidth / 2, 38, { align: "center" });

        // 6. Translucent Watermark in center of page
        doc.setFontSize(60);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(230, 240, 250);
        doc.text("RR", pageWidth / 2, pageHeight / 2 + 10, { align: "center", angle: 25 });

        // 7. Footer
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Sri RR Crackers, Sivakasi · Mobile: +91 87540 66248 · Official Retail Price List 2025`,
          8,
          pageHeight - 5
        );
        doc.text(
          `Page ${pageNumber}`,
          pageWidth - 8,
          pageHeight - 5,
          { align: "right" }
        );

        doc.restoreGraphicsState();
      },
    });

    // 4. Save and trigger download
    doc.save("Sri_RR_Crackers_Price_List_2025.pdf");
    return true;
  } catch (error) {
    console.error("Failed to generate Price List PDF:", error);
    throw error;
  } finally {
    if (onProgress) onProgress(false);
  }
}
