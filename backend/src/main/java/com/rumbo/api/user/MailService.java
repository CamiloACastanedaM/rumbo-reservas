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
        String name = HtmlUtils.htmlEscape(firstName);
        String safeEmail = HtmlUtils.htmlEscape(email);
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
        try {
            var message = sender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(email);
            helper.setSubject("Bienvenido a Rumbo, " + firstName);
            helper.setText("Hola, " + firstName + ". Te registraste en Rumbo con el correo " + email
                    + ". Inicia sesión aquí: " + loginUrl, html);
            sender.send(message);
        } catch (MailException | MessagingException e) {
            log.warn("No se pudo enviar el correo de bienvenida a {}: {}", email, e.getMessage());
        }
    }
}
