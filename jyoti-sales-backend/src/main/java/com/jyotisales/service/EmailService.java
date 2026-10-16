package com.jyotisales.service;

import com.jyotisales.entity.Order;
import com.jyotisales.entity.OrderItem;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * Sends transactional HTML emails for order lifecycle events.
 * All methods are @Async so they never block the HTTP response thread.
 *
 * To activate: set MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD in env.
 * Works with Gmail (App Password), Zoho, AWS SES, or any SMTP provider.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@jyotisales.in}")
    private String fromAddress;

    @Value("${app.business.name:Jyoti Sales}")
    private String businessName;

    @Value("${app.frontend-url:https://jyotisales.in}")
    private String frontendUrl;

    // ── Order Confirmation ────────────────────────────────────────────────────

    @Async
    public void sendOrderConfirmation(Order order) {
        String toEmail = resolveEmail(order);
        if (toEmail == null) return;

        try {
            String subject = "✅ Order Confirmed – " + order.getOrderNumber() + " | " + businessName;
            String html = buildOrderConfirmationHtml(order);
            sendHtml(toEmail, subject, html);
            log.info("[EMAIL] Order confirmation sent to {} for order {}", toEmail, order.getOrderNumber());
        } catch (Exception e) {
            log.error("[EMAIL] Failed to send order confirmation for {}: {}", order.getOrderNumber(), e.getMessage());
        }
    }

    // ── Status Update ─────────────────────────────────────────────────────────

    @Async
    public void sendStatusUpdate(Order order) {
        String toEmail = resolveEmail(order);
        if (toEmail == null) return;

        // Only notify on meaningful status transitions
        if (order.getStatus() == Order.Status.PENDING || order.getStatus() == Order.Status.CONFIRMED) return;

        try {
            String statusLabel = statusLabel(order.getStatus());
            String subject = statusEmoji(order.getStatus()) + " Order " + statusLabel + " – " + order.getOrderNumber();
            String html = buildStatusUpdateHtml(order, statusLabel);
            sendHtml(toEmail, subject, html);
            log.info("[EMAIL] Status update ({}) sent to {} for order {}", order.getStatus(), toEmail, order.getOrderNumber());
        } catch (Exception e) {
            log.error("[EMAIL] Failed to send status update for {}: {}", order.getOrderNumber(), e.getMessage());
        }
    }

    // ── Core send ─────────────────────────────────────────────────────────────

    private void sendHtml(String to, String subject, String html) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromAddress, businessName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    // ── HTML Builders ─────────────────────────────────────────────────────────

    private String buildOrderConfirmationHtml(Order order) {
        StringBuilder itemRows = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            itemRows.append("""
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;">
                        <strong>%s</strong><br>
                        <span style="color:#888;font-size:13px;">Qty: %d</span>
                      </td>
                      <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;text-align:right;font-weight:600;">%s</td>
                    </tr>
                    """.formatted(
                    item.getProductNameSnapshot(),
                    item.getQuantity(),
                    formatInr(lineTotal)
            ));
        }

        Order.ShippingSnapshot addr = order.getShippingAddress();
        String addressStr = addr != null
                ? "%s, %s, %s, %s – %s".formatted(addr.getLine1(),
                  addr.getLine2() != null ? addr.getLine2() + ", " : "",
                  addr.getCity(), addr.getState(), addr.getPincode())
                : "—";

        return baseTemplate(
                "Order Confirmed! 🎉",
                "Thank you for your order. We've received your payment and are preparing your items.",
                """
                <table width="100%%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="padding:8px 16px;background:#1a1a1a;border-radius:8px;">
                      <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
                      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f2a65a;">%s</p>
                    </td>
                  </tr>
                </table>
                
                <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  %s
                  <tr>
                    <td style="padding:10px 0;color:#888;">Subtotal</td>
                    <td style="padding:10px 0;text-align:right;">%s</td>
                  </tr>
                  %s
                  <tr>
                    <td style="padding:10px 0;color:#888;">Shipping</td>
                    <td style="padding:10px 0;text-align:right;">%s</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 0;font-size:18px;font-weight:700;border-top:2px solid #f2a65a;">Total Paid</td>
                    <td style="padding:14px 0;text-align:right;font-size:18px;font-weight:700;color:#f2a65a;border-top:2px solid #f2a65a;">%s</td>
                  </tr>
                </table>
                
                <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-bottom:24px;">
                  <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Delivering To</p>
                  <p style="margin:0;font-size:14px;">%s</p>
                  %s
                </div>
                
                <div style="text-align:center;margin-top:32px;">
                  <a href="%s/profile" style="background:#f2a65a;color:#0d0d0d;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                    Track My Order →
                  </a>
                </div>
                """.formatted(
                        order.getOrderNumber(),
                        itemRows,
                        formatInr(order.getSubtotal()),
                        order.getDiscount().compareTo(BigDecimal.ZERO) > 0
                                ? "<tr><td style='padding:10px 0;color:#4ade80;'>Discount" + (order.getCouponCode() != null ? " (" + order.getCouponCode() + ")" : "") + "</td><td style='padding:10px 0;text-align:right;color:#4ade80;'>- " + formatInr(order.getDiscount()) + "</td></tr>"
                                : "",
                        order.getShippingFee().compareTo(BigDecimal.ZERO) == 0 ? "FREE" : formatInr(order.getShippingFee()),
                        formatInr(order.getTotal()),
                        addressStr,
                        addr != null && addr.getPhone() != null ? "<p style='margin:4px 0 0;font-size:13px;color:#888;'>📞 " + addr.getPhone() + "</p>" : "",
                        frontendUrl
                )
        );
    }

    private String buildStatusUpdateHtml(Order order, String statusLabel) {
        String statusColor = switch (order.getStatus()) {
            case PACKED    -> "#8b5cf6";
            case SHIPPED   -> "#06b6d4";
            case DELIVERED -> "#4ade80";
            case CANCELLED -> "#f87171";
            case REFUNDED  -> "#fb923c";
            default        -> "#f2a65a";
        };

        String message = switch (order.getStatus()) {
            case PACKED    -> "Your items have been packed and are ready for dispatch.";
            case SHIPPED   -> "Your order is on its way! Our delivery team will contact you before arrival.";
            case DELIVERED -> "Your order has been delivered. We hope you love your new purchase!";
            case CANCELLED -> "Your order has been cancelled. If you paid online, your refund will be processed within 5–7 business days.";
            case REFUNDED  -> "Your refund has been processed and should reflect in your account within 2–3 business days.";
            default        -> "Your order status has been updated.";
        };

        return baseTemplate(
                "Order " + statusLabel,
                message,
                """
                <div style="text-align:center;margin:24px 0;">
                  <div style="display:inline-block;background:%s22;border:2px solid %s;border-radius:50px;padding:12px 28px;">
                    <span style="font-size:24px;font-weight:700;color:%s;">%s %s</span>
                  </div>
                </div>
                <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
                  <p style="margin:0;color:#888;font-size:12px;">Order Number</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#f2a65a;">%s</p>
                </div>
                %s
                """.formatted(
                        statusColor, statusColor, statusColor,
                        statusEmoji(order.getStatus()), statusLabel,
                        order.getOrderNumber(),
                        order.getStatus() != Order.Status.CANCELLED
                                ? "<div style='text-align:center;margin-top:32px;'><a href='" + frontendUrl + "/profile' style='background:#f2a65a;color:#0d0d0d;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;'>View My Orders →</a></div>"
                                : ""
                )
        );
    }

    // ── Base email wrapper ────────────────────────────────────────────────────

    private String baseTemplate(String heading, String subheading, String content) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f0f0f0;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
                        <!-- Header -->
                        <tr>
                          <td style="background:linear-gradient(135deg,#1a1a1a,#111);border-radius:16px 16px 0 0;padding:32px;text-align:center;border-bottom:3px solid #f2a65a;">
                            <h1 style="margin:0;font-size:26px;font-weight:800;background:linear-gradient(135deg,#f2a65a,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">%s</h1>
                          </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                          <td style="background:#161616;padding:32px;border-radius:0 0 16px 16px;">
                            <p style="margin:0 0 24px;color:#aaa;font-size:15px;line-height:1.6;">%s</p>
                            %s
                          </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                          <td style="padding:24px 0;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#555;">© %d %s · Questions? Reply to this email.</p>
                            <p style="margin:4px 0 0;font-size:11px;color:#444;">This is an automated message, please do not reply directly.</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(heading, subheading, content,
                java.time.Year.now().getValue(), businessName);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveEmail(Order order) {
        try {
            return order.getUser() != null ? order.getUser().getEmail() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String formatInr(BigDecimal amount) {
        NumberFormat fmt = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return fmt.format(amount);
    }

    private String statusLabel(Order.Status status) {
        return switch (status) {
            case PENDING   -> "Pending";
            case CONFIRMED -> "Confirmed";
            case PACKED    -> "Packed";
            case SHIPPED   -> "Shipped";
            case DELIVERED -> "Delivered";
            case CANCELLED -> "Cancelled";
            case REFUNDED  -> "Refunded";
        };
    }

    private String statusEmoji(Order.Status status) {
        return switch (status) {
            case PACKED    -> "📦";
            case SHIPPED   -> "🚚";
            case DELIVERED -> "✅";
            case CANCELLED -> "❌";
            case REFUNDED  -> "💸";
            default        -> "📋";
        };
    }
}
