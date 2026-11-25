package com.rumbo.api.review;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    @EntityGraph(attributePaths = "user")
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    /** Rows of [productId, average, count] for the products that have reviews. */
    @Query("select r.product.id, avg(r.rating), count(r) from Review r where r.product.id in :productIds group by r.product.id")
    List<Object[]> ratingsOf(Collection<Long> productIds);

    /** Stays of this user that already have a review. */
    @Query("select r.reservation.id from Review r where r.user.id = :userId")
    java.util.Set<Long> reviewedReservationIds(Long userId);
}
