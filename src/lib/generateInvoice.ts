// TODO: To support Georgian text natively, embed NotoSansGeorgian font
// using doc.addFileToVFS() and doc.addFont()
// This requires ~500KB font file added to /public/fonts/
// See: https://github.com/parallax/jsPDF#use-of-unicode-characters

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface InvoiceData {
  orderId: string
  createdAt: Date | string
  buyerName: string
  buyerPhone: string
  buyerAddress: string
  vendorName: string
  items: {
    productName: string
    productNameEn?: string
    variantName?: string | null
    quantity: number
    unitPrice: number
    total: number
  }[]
  subtotal: number
  couponCode?: string | null
  couponDiscount?: number | null
  grandTotal: number
}

/**
 * Sanitize text for jsPDF — replace Georgian characters with English fallback.
 * jsPDF default fonts (helvetica) cannot render Georgian Unicode (U+10D0–U+10FF).
 */
function safeText(text: string, fallback?: string): string {
  if (!text) return "—"
  if (/[\u10D0-\u10FF]/.test(text)) {
    return fallback || text.replace(/[\u10D0-\u10FF]+/g, "?")
  }
  return text
}

function formatPrice(amount: number): string {
  return `GEL ${amount.toFixed(2)}`
}

export function generateOrderInvoice(data: InvoiceData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // HEADER
  doc.setFontSize(22)
  doc.setTextColor(37, 99, 235)
  doc.text("AutoMarket", 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text("automarket.ge", 14, 27)

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text("Invoice", pageWidth - 14, 20, { align: "right" })

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const orderShort = data.orderId.slice(-8).toUpperCase()
  doc.text(`#${orderShort}`, pageWidth - 14, 27, { align: "right" })

  const dateStr = new Date(data.createdAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  doc.text(dateStr, pageWidth - 14, 33, { align: "right" })

  // DIVIDER
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 38, pageWidth - 14, 38)

  // SELLER + BUYER
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text("Vendor", 14, 46)
  doc.text("Buyer", pageWidth / 2, 46)

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(safeText(data.vendorName), 14, 53)
  doc.text(safeText(data.buyerName), pageWidth / 2, 53)

  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  if (data.buyerPhone) doc.text(safeText(data.buyerPhone), pageWidth / 2, 59)
  if (data.buyerAddress) doc.text(safeText(data.buyerAddress), pageWidth / 2, 65)

  // ITEMS TABLE
  autoTable(doc, {
    startY: 75,
    head: [["#", "Product", "Variant", "Qty", "Unit Price", "Total"]],
    body: data.items.map((item, i) => [
      i + 1,
      safeText(item.productName, item.productNameEn),
      item.variantName ? safeText(item.variantName) : "—",
      item.quantity,
      formatPrice(item.unitPrice),
      formatPrice(item.total),
    ]),
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  })

  // SUMMARY
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 8
  const summaryX = pageWidth - 80

  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text("Subtotal:", summaryX, finalY)
  doc.text(formatPrice(data.subtotal), pageWidth - 14, finalY, { align: "right" })

  let couponYOffset = 0
  if (data.couponDiscount && data.couponDiscount > 0) {
    couponYOffset = 7
    doc.setTextColor(34, 197, 94)
    doc.text(`Coupon (${data.couponCode}):`, summaryX, finalY + couponYOffset)
    doc.text(`-${formatPrice(data.couponDiscount)}`, pageWidth - 14, finalY + couponYOffset, { align: "right" })
  }

  // TOTAL
  const totalY = finalY + couponYOffset + 9
  doc.setDrawColor(200, 200, 200)
  doc.line(summaryX, totalY - 3, pageWidth - 14, totalY - 3)

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.text("Grand Total:", summaryX, totalY + 4)
  doc.text(formatPrice(data.grandTotal), pageWidth - 14, totalY + 4, { align: "right" })

  // FOOTER
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5)
  doc.text("Thank you for shopping at AutoMarket!", pageWidth / 2, footerY, { align: "center" })
  doc.text("automarket.ge", pageWidth / 2, footerY + 6, { align: "center" })

  doc.save(`invoice-${orderShort}.pdf`)
}
