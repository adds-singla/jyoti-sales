package com.jyotisales.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.jyotisales.entity.Order;
import com.jyotisales.entity.OrderItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Generates a professional GST-compliant PDF invoice for any Order.
 *
 * Usage: call generate(order) → returns PDF bytes → stream to client.
 */
@Slf4j
@Service
public class InvoiceService {

    @Value("${app.business.name:Jyoti Sales}")
    private String bizName;

    @Value("${app.business.address:Rampura Phul, Punjab}")
    private String bizAddress;

    @Value("${app.business.phone:N/A}")
    private String bizPhone;

    @Value("${app.business.email:N/A}")
    private String bizEmail;

    @Value("${app.business.gstin:N/A}")
    private String bizGstin;

    private static final Color CORAL    = new Color(242, 166, 90);   // brand accent
    private static final Color DARK_BG  = new Color(22, 22, 22);
    private static final Color LIGHT_BG = new Color(245, 245, 245);
    private static final Color BORDER   = new Color(220, 220, 220);
    private static final Color TEXT     = new Color(30, 30, 30);
    private static final Color MUTED    = new Color(110, 110, 110);

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy").withZone(ZoneId.of("Asia/Kolkata"));

    // ── Public API ────────────────────────────────────────────────────────────

    public byte[] generate(Order order) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
            PdfWriter writer = PdfWriter.getInstance(doc, baos);
            writer.setPageEvent(new HeaderFooter());
            doc.open();

            addInvoiceBody(doc, order);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("[INVOICE] Failed to generate PDF for order {}: {}", order.getOrderNumber(), e.getMessage(), e);
            throw new RuntimeException("Invoice generation failed", e);
        }
    }

    // ── Body sections ─────────────────────────────────────────────────────────

    private void addInvoiceBody(Document doc, Order order) throws DocumentException {
        Font titleFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, DARK_BG);
        Font headFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, DARK_BG);
        Font labelFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, MUTED);
        Font bodyFont    = FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT);
        Font accentFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, CORAL);
        Font totalFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, DARK_BG);
        Font smallMuted  = FontFactory.getFont(FontFactory.HELVETICA, 8, MUTED);

        // ── Header: logo text + TAX INVOICE label ──
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{3, 1});
        header.setSpacingAfter(16);

        PdfPCell bizCell = new PdfPCell();
        bizCell.setBorder(Rectangle.NO_BORDER);
        bizCell.setPaddingBottom(6);
        Paragraph bizPara = new Paragraph();
        bizPara.add(new Chunk(bizName + "\n", titleFont));
        bizPara.add(new Chunk(bizAddress + "\n", bodyFont));
        bizPara.add(new Chunk("Ph: " + bizPhone + "  |  " + bizEmail + "\n", bodyFont));
        bizPara.add(new Chunk("GSTIN: " + bizGstin, bodyFont));
        bizCell.addElement(bizPara);
        header.addCell(bizCell);

        PdfPCell taxCell = new PdfPCell();
        taxCell.setBorder(Rectangle.NO_BORDER);
        taxCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        taxCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Paragraph taxLabel = new Paragraph();
        taxLabel.setAlignment(Element.ALIGN_RIGHT);
        Font taxFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, CORAL);
        taxLabel.add(new Chunk("TAX INVOICE", taxFont));
        taxCell.addElement(taxLabel);
        header.addCell(taxCell);

        // Separator line
        PdfPCell sep = new PdfPCell();
        sep.setColspan(2);
        sep.setBackgroundColor(CORAL);
        sep.setFixedHeight(2f);
        sep.setBorder(Rectangle.NO_BORDER);
        header.addCell(sep);
        doc.add(header);

        // ── Order meta: invoice # + date | customer + shipping ──
        PdfPTable meta = new PdfPTable(2);
        meta.setWidthPercentage(100);
        meta.setWidths(new float[]{1, 1});
        meta.setSpacingAfter(14);

        // Left: Invoice details
        PdfPCell leftMeta = metaBox("Invoice Details");
        leftMeta.addElement(metaRow("Invoice No.", order.getOrderNumber(), labelFont, bodyFont));
        leftMeta.addElement(metaRow("Date", DATE_FMT.format(order.getCreatedAt()), labelFont, bodyFont));
        if (order.getCouponCode() != null) {
            leftMeta.addElement(metaRow("Coupon", order.getCouponCode(), labelFont, accentFont));
        }
        meta.addCell(leftMeta);

        // Right: Bill-to
        PdfPCell rightMeta = metaBox("Bill To");
        Order.ShippingSnapshot addr = order.getShippingAddress();
        if (addr != null) {
            rightMeta.addElement(lineElement(addr.getRecipientName(), headFont));
            rightMeta.addElement(lineElement(addr.getLine1(), bodyFont));
            if (addr.getLine2() != null && !addr.getLine2().isBlank()) {
                rightMeta.addElement(lineElement(addr.getLine2(), bodyFont));
            }
            rightMeta.addElement(lineElement(addr.getCity() + ", " + addr.getState() + " – " + addr.getPincode(), bodyFont));
            rightMeta.addElement(lineElement("Ph: " + addr.getPhone(), bodyFont));
        }
        meta.addCell(rightMeta);
        doc.add(meta);

        // ── Items table ──
        PdfPTable items = new PdfPTable(5);
        items.setWidthPercentage(100);
        items.setWidths(new float[]{0.5f, 3.5f, 1, 1.2f, 1.2f});
        items.setSpacingAfter(12);

        // Table header
        String[] cols = {"#", "Product", "Qty", "Unit Price", "Total"};
        for (String col : cols) {
            PdfPCell c = new PdfPCell(new Phrase(col, labelFont));
            c.setBackgroundColor(DARK_BG);
            c.setPadding(8);
            c.setBorderColor(DARK_BG);
            Font whiteFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            c.setPhrase(new Phrase(col, whiteFont));
            c.setHorizontalAlignment(col.equals("#") || col.equals("Qty") ? Element.ALIGN_CENTER : Element.ALIGN_LEFT);
            items.addCell(c);
        }

        // Table rows
        int rowNum = 1;
        for (OrderItem oi : order.getItems()) {
            BigDecimal lineTotal = oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity()));
            Color rowBg = rowNum % 2 == 0 ? LIGHT_BG : Color.WHITE;

            addItemCell(items, String.valueOf(rowNum++), Element.ALIGN_CENTER, rowBg, bodyFont);
            addItemCell(items, oi.getProductNameSnapshot(), Element.ALIGN_LEFT, rowBg, bodyFont);
            addItemCell(items, String.valueOf(oi.getQuantity()), Element.ALIGN_CENTER, rowBg, bodyFont);
            addItemCell(items, formatInr(oi.getUnitPrice()), Element.ALIGN_LEFT, rowBg, bodyFont);
            addItemCell(items, formatInr(lineTotal), Element.ALIGN_LEFT, rowBg, bodyFont);
        }
        doc.add(items);

        // ── Totals ──
        PdfPTable totals = new PdfPTable(2);
        totals.setWidthPercentage(45);
        totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totals.setSpacingAfter(24);

        addTotalRow(totals, "Subtotal", formatInr(order.getSubtotal()), bodyFont, bodyFont, Color.WHITE);
        if (order.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            Font greenFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(34, 197, 94));
            Font greenBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(34, 197, 94));
            addTotalRow(totals, "Discount", "– " + formatInr(order.getDiscount()), greenFont, greenBold, Color.WHITE);
        }
        addTotalRow(totals, "Shipping", order.getShippingFee().compareTo(BigDecimal.ZERO) == 0
                ? "FREE" : formatInr(order.getShippingFee()), bodyFont, bodyFont, Color.WHITE);

        // Grand total row
        PdfPCell gtLabel = new PdfPCell(new Phrase("TOTAL", totalFont));
        gtLabel.setBackgroundColor(DARK_BG);
        gtLabel.setPadding(9);
        gtLabel.setBorderColor(DARK_BG);
        Font totalValueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, CORAL);
        PdfPCell gtValue = new PdfPCell(new Phrase(formatInr(order.getTotal()), totalValueFont));
        gtValue.setBackgroundColor(DARK_BG);
        gtValue.setPadding(9);
        gtValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
        gtValue.setBorderColor(DARK_BG);
        totals.addCell(gtLabel);
        totals.addCell(gtValue);

        doc.add(totals);

        // ── Terms / Notes ──
        Paragraph terms = new Paragraph();
        terms.add(new Chunk("Terms & Conditions\n", labelFont));
        terms.add(new Chunk("1. Goods once sold will not be taken back unless defective.\n", smallMuted));
        terms.add(new Chunk("2. Warranty subject to manufacturer terms.\n", smallMuted));
        terms.add(new Chunk("3. Payment received. This is a computer-generated invoice.\n", smallMuted));
        terms.add(new Chunk("4. For queries: " + bizPhone + " | " + bizEmail, smallMuted));
        doc.add(terms);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PdfPCell metaBox(String title) {
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, MUTED);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(LIGHT_BG);
        cell.setBorderColor(BORDER);
        cell.setPadding(10);
        cell.addElement(new Phrase(title + "\n", titleFont));
        return cell;
    }

    private Paragraph metaRow(String label, String value, Font labelFont, Font valueFont) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + ": ", labelFont));
        p.add(new Chunk(value, valueFont));
        p.add(Chunk.NEWLINE);
        return p;
    }

    private Phrase lineElement(String text, Font font) {
        return new Phrase(text + "\n", font);
    }

    private void addItemCell(PdfPTable t, String text, int align, Color bg, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setBackgroundColor(bg);
        c.setPadding(7);
        c.setBorderColor(BORDER);
        c.setHorizontalAlignment(align);
        t.addCell(c);
    }

    private void addTotalRow(PdfPTable t, String label, String value, Font labelFont, Font valueFont, Color bg) {
        PdfPCell lc = new PdfPCell(new Phrase(label, labelFont));
        lc.setBackgroundColor(bg);
        lc.setPadding(7);
        lc.setBorderColor(BORDER);
        PdfPCell vc = new PdfPCell(new Phrase(value, valueFont));
        vc.setBackgroundColor(bg);
        vc.setPadding(7);
        vc.setBorderColor(BORDER);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(lc);
        t.addCell(vc);
    }

    private String formatInr(BigDecimal amount) {
        NumberFormat fmt = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return fmt.format(amount);
    }

    // ── Header/Footer on every page ───────────────────────────────────────────

    private class HeaderFooter extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 7, MUTED);
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                    new Phrase("Page " + writer.getPageNumber() + "  |  " + bizName + "  |  GSTIN: " + bizGstin, footerFont),
                    (document.left() + document.right()) / 2,
                    document.bottom() - 15, 0);
        }
    }
}
