package com.rumbo.api.reservation;

import com.rumbo.api.product.Product;
import com.rumbo.api.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/** A stay is [startDate, endDate): the check-out day is free for the next guest. */
@Entity
@Table(name = "reservations")
@Getter
@Setter
public class Reservation {
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

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** Stays made before Sprint 4 had no guest count: the column default fills them with 1. */
    @ColumnDefault("1")
    @Column(nullable = false)
    private int guests = 1;

    /** Optional booking data the guest may add. */
    @Column(length = 20)
    private String phone;

    @Column(name = "arrival_time")
    private LocalTime arrivalTime;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
