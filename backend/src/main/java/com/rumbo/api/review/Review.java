package com.rumbo.api.review;

import com.rumbo.api.product.Product;
import com.rumbo.api.reservation.Reservation;
import com.rumbo.api.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

/** One review per finished reservation. */
@Entity
@Table(name = "reviews")
@Getter
@Setter
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Product product;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Reservation reservation;

    @Column(nullable = false)
    private int rating;

    @Column(length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public static Review of(Reservation stay, int rating, String comment) {
        Review review = new Review();
        review.setUser(stay.getUser());
        review.setProduct(stay.getProduct());
        review.setReservation(stay);
        review.setRating(rating);
        review.setComment(comment);
        return review;
    }
}
