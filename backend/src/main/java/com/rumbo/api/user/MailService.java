package com.rumbo.api.user;

import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class MailService {
    private static final Logger log = LoggerFactory.getLogger(MailService.class);
    private final JavaMailSender sender;
    private final String from;
    private final String frontendUrl;

    public MailService(JavaMailSender sender, @Value("${app.mail.from}") String from,
                       @Value("${app.frontend-url}") String frontendUrl) {
        this.sender = sender;
        this.from = from;
        this.frontendUrl = frontendUrl;
    }

    /** Sent in the background: a mail outage never blocks or undoes a registration. */
    @Async
    public void sendWelcome(String firstName, String email) {
        String loginUrl = frontendUrl + "/iniciar-sesion";
        String name = HtmlUtils.htmlEscape(firstName, "UTF-8");
        String safeEmail = HtmlUtils.htmlEscape(email, "UTF-8");
        String html = """
                <!doctype html>
                <html lang="es"><body style="margin:0;background:#dce8d3;font-family:Arial,sans-serif;color:#17402f">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#f6f8f2;border-radius:8px">
                <tr><td style="background:#17402f;color:#f6f8f2;padding:20px 24px;border-radius:8px 8px 0 0;font-size:24px;font-weight:800">rumbo</td></tr>
                <tr><td style="padding:24px;font-size:16px;line-height:1.55">
                <h1 style="font-size:22px;margin:0 0 12px">¡Hola, %s! Tu cuenta está lista</h1>
                <p style="margin:0 0 12px">Te registraste en Rumbo con el correo <strong>%s</strong>.</p>
                <p style="margin:0 0 20px">Ya puedes iniciar sesión para guardar favoritos y reservar tu próxima escapada.</p>
                <p style="margin:0 0 20px"><a href="%s" style="display:inline-block;background:#c0185e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:4px">Iniciar sesión</a></p>
                <p style="margin:0;font-size:13px;color:#4b6a5c">Si no creaste esta cuenta, ignora este correo.</p>
                </td></tr></table></td></tr></table></body></html>
                """.formatted(name, safeEmail, loginUrl);
        send(email, "Bienvenido a Rumbo, " + firstName, "Hola, " + firstName + ". Te registraste en Rumbo con el correo "
                + email + ". Inicia sesión aquí: " + loginUrl, html, "de bienvenida");
    }

    /** Everything the booking email shows. phone is the host's WhatsApp number (may be null). */
    public record BookingMail(String firstName, String email, Long reservationId, String productName, String city,
                              String address, String phone, LocalDate start, LocalDate end, long nights, int guests,
                              BigDecimal total, Instant bookedAt) {
    }

    private static final Locale ES_CO = Locale.forLanguageTag("es-CO");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", ES_CO);
    private static final DateTimeFormatter BOOKED_AT = DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy, h:mm a", ES_CO)
            .withZone(ZoneId.of("America/Bogota"));

    /** Booking confirmation, sent in the background right after the reservation is saved. */
    @Async
    public void sendBooking(BookingMail b) {
        String historyUrl = frontendUrl + "/mis-reservas";
        String place = String.join(", ", java.util.stream.Stream.of(b.address(), b.city())
                .filter(v -> v != null && !v.isBlank()).toList());
        String contact = b.phone() == null ? "El anfitrión te escribirá por este correo si necesita algo."
                : "WhatsApp del anfitrión: +" + b.phone().replaceAll("[^0-9]", "");
        String total = b.total() == null ? "A convenir con el anfitrión"
                : NumberFormat.getCurrencyInstance(ES_CO).format(b.total()).replace(",00", "");
        String nights = b.nights() + (b.nights() == 1 ? " noche" : " noches");
        String guests = b.guests() + (b.guests() == 1 ? " huésped" : " huéspedes");
        String[][] rows = {
                {"Alojamiento", b.productName()},
                {"Dirección", place.isEmpty() ? "Te la confirmará el anfitrión" : place},
                {"Llegada", DAY.format(b.start())},
                {"Salida", DAY.format(b.end())},
                {"Estadía", nights + " · " + guests},
                {"Total", total},
                {"Reservada el", BOOKED_AT.format(b.bookedAt())},
                {"Contacto", contact},
        };
        StringBuilder table = new StringBuilder();
        StringBuilder text = new StringBuilder("Hola, " + b.firstName() + ". Tu reserva en Rumbo está confirmada.\n\n");
        for (String[] row : rows) {
            table.append("<tr><td style=\"padding:8px 0;color:#4b6a5c;font-size:14px;vertical-align:top;width:120px\">")
                    .append(row[0]).append("</td><td style=\"padding:8px 0;font-size:15px;font-weight:700\">")
                    .append(HtmlUtils.htmlEscape(row[1], "UTF-8")).append("</td></tr>");
            text.append(row[0]).append(": ").append(row[1]).append("\n");
        }
        text.append("\nVe todas tus reservas aquí: ").append(historyUrl);
        String html = """
                <!doctype html>
                <html lang="es"><body style="margin:0;background:#dce8d3;font-family:Arial,sans-serif;color:#17402f">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#f6f8f2;border-radius:8px">
                <tr><td style="background:#17402f;color:#f6f8f2;padding:20px 24px;border-radius:8px 8px 0 0;font-size:24px;font-weight:800">rumbo</td></tr>
                <tr><td style="padding:24px;font-size:16px;line-height:1.55">
                <h1 style="font-size:22px;margin:0 0 8px">¡Listo, %s! Tu reserva está confirmada</h1>
                <p style="margin:0 0 16px">Reserva n.º %d. Guarda este correo para tenerla a mano.</p>
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="border-top:1px solid #c9d6c0;margin:0 0 20px">%s</table>
                <p style="margin:0 0 20px"><a href="%s" style="display:inline-block;background:#c0185e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:4px">Ver mis reservas</a></p>
                <p style="margin:0;font-size:13px;color:#4b6a5c">Si no hiciste esta reserva, responde a este correo y la revisamos.</p>
                </td></tr></table></td></tr></table></body></html>
                """.formatted(HtmlUtils.htmlEscape(b.firstName(), "UTF-8"), b.reservationId(), table, historyUrl);
        send(b.email(), "Reserva confirmada: " + b.productName(), text.toString(), html, "de reserva");
    }

    private void send(String to, String subject, String text, String html, String kind) {
        try {
            var message = sender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, html);
            sender.send(message);
        } catch (MailException | MessagingException e) {
            log.warn("No se pudo enviar el correo {} a {}: {}", kind, to, e.getMessage());
        }
    }
}
