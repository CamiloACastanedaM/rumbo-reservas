package com.rumbo.api.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    /** History of one user, latest stay first. */
    @Query("select r from Reservation r where r.user.id = :userId order by r.startDate desc, r.id desc")
    List<Reservation> findHistory(Long userId);

    /** Stays of one product that end after `from` and start before `to`, in date order. */
    @Query("select r from Reservation r where r.product.id = :productId and r.endDate > :from and r.startDate < :to order by r.startDate")
    List<Reservation> findOverlapping(Long productId, LocalDate from, LocalDate to);

    /** Products with at least one stay that intersects [start, end). */
    @Query("select distinct r.product.id from Reservation r where r.startDate < :end and r.endDate > :start")
    Set<Long> findBookedProductIds(LocalDate start, LocalDate end);

    /** Finished stays of this user in this product that have no review yet, oldest first. */
    @Query("select r from Reservation r where r.user.id = :userId and r.product.id = :productId and r.endDate < :today "
            + "and not exists (select 1 from Review v where v.reservation = r) order by r.endDate")
    List<Reservation> findReviewable(Long userId, Long productId, LocalDate today);
}
