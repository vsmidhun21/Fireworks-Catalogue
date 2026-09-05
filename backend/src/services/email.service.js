import nodemailer from "nodemailer";

/**
 * Creates and returns a Nodemailer transporter configured for Gmail SMTP.
 * Returns null if credentials are not configured or are set to placeholder values.
 */
function getTransporter() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT) || 465;
  const secure = process.env.EMAIL_SECURE === "true" || port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass || user.includes("your-development-gmail") || pass.includes("your-gmail-app-password")) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/** Formats a numeric amount to Indian Rupee currency display. */
function formatCurrency(val) {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/** Formats an ISO date string into Indian Standard Time (IST). */
function formatDate(isoDate) {
  if (!isoDate) return "N/A";
  try {
    const d = new Date(isoDate);
    return (
      d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST"
    );
  } catch {
    return String(isoDate);
  }
}

/** Escapes special HTML characters to prevent rendering bugs and injection. */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates the responsive HTML email body for admin estimate notifications.
 */
export function generateEstimateAdminEmailHtml(estimate) {
  const customer = estimate.customer || {};
  const items = Array.isArray(estimate.items) ? estimate.items : [];
  const siteUrl = process.env.PUBLIC_SITE_URL || (process.env.CORS_ORIGINS || "http://localhost:5173").split(",")[0].trim();
  const adminEstimateUrl = estimate.id ? `${siteUrl}/admin/estimates/${estimate.id}` : null;

  const customerEmail = customer.email && String(customer.email).trim().length > 0
    ? escapeHtml(customer.email.trim())
    : '<span style="color: #94A3B8; font-style: italic;">Not provided</span>';

  const customerNotesRow = estimate.customerNotes
    ? `<tr>
        <td style="padding: 6px 0; font-size: 13px; color: #64748B; vertical-align: top; width: 120px;"><strong>Customer Notes:</strong></td>
        <td style="padding: 6px 0; font-size: 13px; color: #1E293B; font-style: italic;">${escapeHtml(estimate.customerNotes)}</td>
       </tr>`
    : "";

  const itemsRowsHtml = items
    .map((item, idx) => {
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? "#FFFFFF" : "#F8FAFC";
      const unitOrig = formatCurrency(item.originalUnitPrice);
      const unitDisc = item.discountedUnitPrice != null ? formatCurrency(item.discountedUnitPrice) : unitOrig;
      const lineTotal = formatCurrency(item.lineTotal);

      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #5B21B6; font-family: monospace;">${escapeHtml(item.productCode || "-")}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #1E293B;">
            <strong>${escapeHtml(item.productNameEn || "Crackers Item")}</strong>
            ${item.productNameTa ? `<br/><span style="font-size: 11px; color: #64748B;">${escapeHtml(item.productNameTa)}</span>` : ""}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: center; color: #1E293B; font-weight: 700;">
            ${escapeHtml(item.quantity)} <span style="font-size: 11px; color: #64748B; font-weight: 400;">(${escapeHtml(item.unit || "Box")})</span>
          </td>
          <td style="padding: 10px 12px; font-size: 12px; text-align: right; color: #94A3B8; text-decoration: line-through;">${unitOrig}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: #1E293B; font-weight: 600;">${unitDisc}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: #5B21B6; font-weight: 700;">${lineTotal}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Estimate Received — ${escapeHtml(estimate.estimateNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1F2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #101828 0%, #1E1B4B 50%, #5B21B6 100%); padding: 28px 24px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: #F59E0B; color: #020617; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 8px;">
                      NEW ESTIMATE NOTIFICATION
                    </span>
                    <h1 style="margin: 6px 0 0 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px;">SRI RR CRACKERS</h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #CBD5E1;">Direct Sivakasi Fireworks & Festive Crackers</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notification Hero Bar -->
          <tr>
            <td style="background-color: #FFF8ED; border-bottom: 1px solid #FED7AA; padding: 14px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 14px; font-weight: 700; color: #9A3412;">
                      Estimate Number: <span style="color: #C2410C; font-family: monospace; font-size: 15px;">${escapeHtml(estimate.estimateNumber)}</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #5B21B6; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px; text-transform: uppercase;">
                      ${escapeHtml(estimate.status || "NEW")}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 24px;">
              
              <!-- Estimate Overview Cards -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 600;">Date & Time</td>
                        <td style="font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 600; text-align: right;">Estimated Total</td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #0F172A; font-weight: 600; padding-top: 4px;">${formatDate(estimate.createdAt)}</td>
                        <td style="font-size: 20px; color: #5B21B6; font-weight: 800; text-align: right; padding-top: 4px;">${formatCurrency(estimate.estimatedTotal)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Customer Information Section -->
              <div style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px;">
                  Customer Information
                </h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFFFF;">
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #64748B; width: 120px;"><strong>Name:</strong></td>
                    <td style="padding: 6px 0; font-size: 14px; color: #0F172A; font-weight: 600;">${escapeHtml(customer.name || "N/A")}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #64748B;"><strong>Mobile Number:</strong></td>
                    <td style="padding: 6px 0; font-size: 14px; color: #0F172A; font-weight: 600;">
                      <a href="tel:${escapeHtml(customer.phone)}" style="color: #F97316; text-decoration: none; font-weight: 700;">${escapeHtml(customer.phone || "N/A")}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #64748B;"><strong>Email Address:</strong></td>
                    <td style="padding: 6px 0; font-size: 13px; color: #0F172A;">${customerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #64748B; vertical-align: top;"><strong>Delivery Address:</strong></td>
                    <td style="padding: 6px 0; font-size: 13px; color: #0F172A; line-height: 1.5;">
                      ${escapeHtml(customer.address || "")}<br/>
                      ${escapeHtml(customer.city || "")}, ${escapeHtml(customer.state || "")} — <strong>${escapeHtml(customer.pincode || "")}</strong>
                    </td>
                  </tr>
                  ${customerNotesRow}
                </table>
              </div>

              <!-- Product Details Table -->
              <div style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px;">
                  Estimated Products (${items.length} ${items.length === 1 ? "Item" : "Items"})
                </h2>
                <div style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #101828; color: #FFFFFF;">
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Code</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Product</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Qty</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Orig.</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Price</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsRowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Price Breakdown / Financial Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%"></td>
                  <td width="50%">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 16px;">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748B;">Retail Subtotal:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #1E293B; text-align: right; font-weight: 600;">${formatCurrency(estimate.subtotal)}</td>
                      </tr>
                      ${estimate.totalDiscount > 0 ? `
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #16A34A;">Festive Discount:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #16A34A; text-align: right; font-weight: 700;">- ${formatCurrency(estimate.totalDiscount)}</td>
                      </tr>` : ""}
                      <tr style="border-top: 1px solid #CBD5E1;">
                        <td style="padding: 8px 0 0 0; font-size: 14px; font-weight: 800; color: #0F172A;">Estimated Total:</td>
                        <td style="padding: 8px 0 0 0; font-size: 18px; font-weight: 900; color: #5B21B6; text-align: right;">${formatCurrency(estimate.estimatedTotal)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Required Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 10px; padding: 14px 16px;">
                <tr>
                  <td style="font-size: 13px; color: #92400E; line-height: 1.5;">
                    <strong style="color: #78350F;">Next Action for Admin:</strong><br/>
                    Please contact the customer to discuss availability, final pricing, payment and delivery details.
                  </td>
                </tr>
              </table>

              ${adminEstimateUrl ? `
              <!-- View in Admin Panel CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px; text-align: center;">
                <tr>
                  <td align="center">
                    <a href="${adminEstimateUrl}" target="_blank" style="display: inline-block; background-color: #5B21B6; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(91, 33, 182, 0.3);">
                      View Estimate in Admin Panel →
                    </a>
                  </td>
                </tr>
              </table>` : ""}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 20px 24px; text-align: center; border-top: 1px solid #1E293B;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                This is an automated admin notification from <strong>Sri RR Crackers</strong> catalogue platform.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748B;">
                Do not reply directly to this notification. Contact the customer at <a href="tel:${escapeHtml(customer.phone)}" style="color: #F97316; text-decoration: none;">${escapeHtml(customer.phone)}</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of the estimate email for non-HTML email clients.
 */
function generateEstimateAdminEmailText(estimate) {
  const customer = estimate.customer || {};
  const items = Array.isArray(estimate.items) ? estimate.items : [];

  const lines = [
    "===========================================================",
    "SRI RR CRACKERS — NEW ESTIMATE RECEIVED",
    "===========================================================",
    "",
    `Estimate Number : ${estimate.estimateNumber}`,
    `Date & Time     : ${formatDate(estimate.createdAt)}`,
    `Status          : ${estimate.status || "NEW"}`,
    `Estimated Total : ${formatCurrency(estimate.estimatedTotal)}`,
    "",
    "-----------------------------------------------------------",
    "CUSTOMER INFORMATION",
    "-----------------------------------------------------------",
    `Name            : ${customer.name || "N/A"}`,
    `Phone / Mobile  : ${customer.phone || "N/A"}`,
    `Email           : ${customer.email || "Not provided"}`,
    `Address         : ${customer.address || ""}, ${customer.city || ""}, ${customer.state || ""} - ${customer.pincode || ""}`,
  ];

  if (estimate.customerNotes) {
    lines.push(`Customer Notes  : ${estimate.customerNotes}`);
  }

  lines.push(
    "",
    "-----------------------------------------------------------",
    "ESTIMATED PRODUCTS",
    "-----------------------------------------------------------"
  );

  items.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. [${item.productCode || "-"}] ${item.productNameEn || "Item"}`,
      `   Qty: ${item.quantity} ${item.unit || "Box"} | Unit Price: ${formatCurrency(item.discountedUnitPrice ?? item.originalUnitPrice)} | Total: ${formatCurrency(item.lineTotal)}`
    );
  });

  lines.push(
    "",
    "-----------------------------------------------------------",
    "FINANCIAL SUMMARY",
    "-----------------------------------------------------------",
    `Subtotal        : ${formatCurrency(estimate.subtotal)}`,
    `Discount        : ${formatCurrency(estimate.totalDiscount)}`,
    `Estimated Total : ${formatCurrency(estimate.estimatedTotal)}`,
    "",
    "-----------------------------------------------------------",
    "ACTION REQUIRED:",
    "Please contact the customer to discuss availability, final pricing, payment and delivery details.",
    "==========================================================="
  );

  return lines.join("\n");
}

/**
 * Sends a notification email to the admin with complete customer and estimate details.
 * Throws on failure or returns send metadata.
 *
 * @param {object} estimateData Complete estimate record with items and customer details
 * @returns {Promise<object>} Nodemailer send result or skip status
 */
export async function sendNewEstimateAdminEmail(estimateData) {
  if (!estimateData || !estimateData.estimateNumber) {
    throw new Error("Invalid estimate data: estimateNumber is required");
  }

  const adminEmails = [...new Set(
    String(process.env.ADMIN_EMAIL || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean)
  )];
  if (adminEmails.length === 0) {
    console.warn("[Email Service] Notification skipped: ADMIN_EMAIL is not configured in environment.");
    return { skipped: true, reason: "ADMIN_EMAIL not configured" };
  }

  const ccEmails = [...new Set(
    String(process.env.ADMIN_CC_EMAILS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean)
  )];

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      `[Email Service] Notification skipped for ${estimateData.estimateNumber}: EMAIL_USER or EMAIL_PASSWORD is missing or set to placeholder.`
    );
    return { skipped: true, reason: "SMTP credentials not configured" };
  }

  const fromName = process.env.EMAIL_FROM_NAME || "Sri RR Crackers";
  const fromEmail = process.env.EMAIL_USER;
  const subject = `New Estimate Received — ${estimateData.estimateNumber}`;
  const html = generateEstimateAdminEmailHtml(estimateData);
  const text = generateEstimateAdminEmailText(estimateData);

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: adminEmails,
    subject,
    text,
    html,
  };

  if (ccEmails.length > 0) {
    mailOptions.cc = ccEmails;
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email Service] Admin notification email sent successfully for ${estimateData.estimateNumber} to ${adminEmails.length} recipient(s)${ccEmails.length > 0 ? ` + ${ccEmails.length} CC recipient(s)` : ""} (MessageId: ${info.messageId})`);
  return info;
}
