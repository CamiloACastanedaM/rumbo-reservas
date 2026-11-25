package com.rumbo.api.review;

import com.rumbo.api.common.ApiException;
import com.rumbo.api.product.ProductDtos.Rating;
import com.rumbo.api.product.ProductRepository;
import com.rumbo.api.product.ProductService;
import com.rumbo.api.reservation.Reservation;
import com.rumbo.api.reservation.ReservationRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ReviewController {
    private final ReviewRepository reviews;
    private final ReservationRepository reservations;
    private final ProductRepository products;
    private final ProductService productService;

    public ReviewController(ReviewRepository reviews, ReservationRepository reservations, ProductRepository products,
                            ProductService productService) {
        this.reviews = reviews;
        this.reservations = reservations;
        this.products = products;
        this.productService = productService;
    }

    /** userName = first name + last-name initial, so reviews never expose full names. */
    public record ReviewDto(Long id, int rating, String comment, String userName, Instant createdAt) {
        static ReviewDto from(Review r) {
            return new ReviewDto(r.getId(), r.getRating(), r.getComment(),
                    r.getUser().getFirstName() + " " + r.getUser().getLastName().charAt(0) + ".", r.getCreatedAt());
        }
    }

    /** canReview: the visitor is signed in and has a finished stay here that is not rated yet. */
    public record ReviewsResponse(Rating rating, List<ReviewDto> reviews, boolean canReview) {
    }

    public record ReviewForm(
            @Min(value = 1, message = "Elige de 1 a 5 estrellas.") @Max(value = 5, message = "Elige de 1 a 5 estrellas.") int rating,
            @Size(max = 1000, message = "El comentario admite hasta 1000 caracteres.") String comment) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ReviewsResponse list(@PathVariable Long productId, @AuthenticationPrincipal Long userId) {
        if (!products.existsById(productId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No encontramos ese alojamiento.");
        }
        boolean canReview = userId != null
                && !reservations.findReviewable(userId, productId, LocalDate.now()).isEmpty();
        return new ReviewsResponse(productService.rating(productId),
                reviews.findByProductIdOrderByCreatedAtDesc(productId).stream().map(ReviewDto::from).toList(), canReview);
    }

    /** Rates the oldest finished stay of this user here that has no review yet. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ReviewsResponse create(@PathVariable Long productId, @AuthenticationPrincipal Long userId,
                                  @Valid @RequestBody ReviewForm form) {
        List<Reservation> open = reservations.findReviewable(userId, productId, LocalDate.now());
        if (open.isEmpty()) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Solo puedes calificar un alojamiento después de terminar una estadía en él, una vez por estadía.");
        }
        Reservation stay = open.getFirst();
        Review review = new Review();
        review.setUser(stay.getUser());
        review.setProduct(stay.getProduct());
        review.setReservation(stay);
        review.setRating(form.rating());
        review.setComment(form.comment() == null || form.comment().isBlank() ? null : form.comment().trim());
        reviews.saveAndFlush(review);
        return list(productId, userId);
    }
}
