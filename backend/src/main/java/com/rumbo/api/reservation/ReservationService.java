package com.rumbo.api.reservation;

import com.rumbo.api.common.ApiException;
import com.rumbo.api.product.Product;
import com.rumbo.api.product.ProductDtos.ProductSummary;
import com.rumbo.api.product.ProductRepository;
import com.rumbo.api.product.ProductService;
import com.rumbo.api.reservation.ReservationDtos.ReservationDto;
import com.rumbo.api.reservation.ReservationDtos.ReservationForm;
import com.rumbo.api.review.ReviewRepository;
import com.rumbo.api.user.MailService;
import com.rumbo.api.user.MailService.BookingMail;
import com.rumbo.api.user.User;
import com.rumbo.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReservationService {
    static final int MAX_NIGHTS = 30;
    private final ReservationRepository reservations;
    private final ProductRepository products;
    private final ProductService productService;
    private final ReviewRepository reviews;
    private final UserRepository users;
    private final MailService mail;

    public ReservationService(ReservationRepository reservations, ProductRepository products, ProductService productService,
                              ReviewRepository reviews, UserRepository users, MailService mail) {
        this.reservations = reservations;
        this.products = products;
        this.productService = productService;
        this.reviews = reviews;
        this.users = users;
        this.mail = mail;
    }

    /** Books [start, end) if no other stay of the product touches it. The product row stays locked until the commit. */
    @Transactional
    public ReservationDto create(Long userId, ReservationForm form) {
        LocalDate today = LocalDate.now();
        LocalDate start = form.startDate(), end = form.endDate();
        if (start.isBefore(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La fecha de llegada no puede ser anterior a hoy. Elige otra en el calendario.");
        }
        if (!end.isAfter(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La salida debe ser al menos un día después de la llegada.");
        }
        if (ChronoUnit.DAYS.between(start, end) > MAX_NIGHTS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Puedes reservar hasta " + MAX_NIGHTS + " noches seguidas. Acorta el rango de fechas.");
        }
        if (start.isAfter(today.plusYears(1))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Solo recibimos reservas hasta un año antes de la llegada.");
        }
        Product product = products.findForUpdate(form.productId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Este alojamiento ya no está disponible en Rumbo."));
        if (!reservations.findOverlapping(product.getId(), start, end).isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Alguien reservó parte de esas fechas. Elige otro rango: los días tachados del calendario ya están ocupados.");
        }
        User user = users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Inicia sesión para continuar."));
        Reservation r = new Reservation();
        r.setUser(user);
        r.setProduct(product);
        r.setStartDate(start);
        r.setEndDate(end);
        r.setGuests(form.guests() == null ? 1 : form.guests());
        r.setPhone(blankToNull(form.phone()));
        r.setArrivalTime(form.arrivalTime());
        r.setNotes(blankToNull(form.notes()));
        reservations.save(r);
        ReservationDto dto = ReservationDto.from(r, productService.summaries(List.of(product.getId())).getFirst(), today, false);
        BookingMail booking = new BookingMail(user.getFirstName(), user.getEmail(), dto.id(), product.getName(),
                product.getCity(), product.getAddress(), product.getWhatsappPhone(), start, end, dto.nights(),
                dto.guests(), dto.total(), r.getCreatedAt());
        // Only a committed booking gets its email; the send itself runs in the background.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                mail.sendBooking(booking);
            }
        });
        return dto;
    }

    /** The user's stays, latest first, each with its product card. */
    @Transactional(readOnly = true)
    public List<ReservationDto> history(Long userId) {
        List<Reservation> list = reservations.findHistory(userId);
        Map<Long, ProductSummary> cards = productService.summaries(
                        list.stream().map(r -> r.getProduct().getId()).distinct().toList()).stream()
                .collect(Collectors.toMap(ProductSummary::id, Function.identity()));
        Set<Long> reviewed = reviews.reviewedReservationIds(userId);
        LocalDate today = LocalDate.now();
        return list.stream().map(r -> ReservationDto.from(r, cards.get(r.getProduct().getId()), today,
                reviewed.contains(r.getId()))).toList();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
