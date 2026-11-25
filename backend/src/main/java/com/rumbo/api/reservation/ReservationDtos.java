package com.rumbo.api.reservation;

import com.rumbo.api.product.ProductDtos.ProductSummary;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

public final class ReservationDtos {
    private ReservationDtos() {
    }

    /** Dates are [startDate, endDate): endDate is the check-out day. phone, arrivalTime and notes are optional. */
    public record ReservationForm(
            @NotNull(message = "Elige el alojamiento que quieres reservar.") Long productId,
            @NotNull(message = "Elige la fecha de llegada.") LocalDate startDate,
            @NotNull(message = "Elige la fecha de salida.") LocalDate endDate,
            @Min(value = 1, message = "Indica al menos 1 huésped.")
            @Max(value = 20, message = "Puedes reservar para máximo 20 huéspedes.") Integer guests,
            @Size(max = 20, message = "El teléfono admite hasta 20 caracteres.")
            @Pattern(regexp = "^$|^\\+?(?:[ ()-]*[0-9]){7,15}[ ()-]*$", message = "Escribe un teléfono válido: de 7 a 15 dígitos; puedes usar espacios, guiones y paréntesis.")
            String phone,
            LocalTime arrivalTime,
            @Size(max = 500, message = "Las notas admiten hasta 500 caracteres.") String notes) {
    }

    public enum Status { PROXIMA, EN_CURSO, FINALIZADA }

    /** canReview: the stay ended before today and has no review yet. */
    public record ReservationDto(Long id, ProductSummary product, LocalDate startDate, LocalDate endDate, long nights,
                                 int guests, String phone, LocalTime arrivalTime, String notes, BigDecimal total,
                                 Instant createdAt, Status status, boolean canReview) {
        static ReservationDto from(Reservation r, ProductSummary product, LocalDate today, boolean reviewed) {
            long nights = ChronoUnit.DAYS.between(r.getStartDate(), r.getEndDate());
            BigDecimal price = product.pricePerNight();
            Status status = today.isBefore(r.getStartDate()) ? Status.PROXIMA
                    : today.isAfter(r.getEndDate()) ? Status.FINALIZADA : Status.EN_CURSO;
            return new ReservationDto(r.getId(), product, r.getStartDate(), r.getEndDate(), nights, r.getGuests(),
                    r.getPhone(), r.getArrivalTime(), r.getNotes(),
                    price == null ? null : price.multiply(BigDecimal.valueOf(nights)), r.getCreatedAt(), status,
                    status == Status.FINALIZADA && !reviewed);
        }
    }
}
