package com.rumbo.api.reservation;

import com.rumbo.api.reservation.ReservationDtos.ReservationDto;
import com.rumbo.api.reservation.ReservationDtos.ReservationForm;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Bookings of the signed-in user (any role). */
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationDto create(@AuthenticationPrincipal Long userId, @Valid @RequestBody ReservationForm form) {
        return service.create(userId, form);
    }

    @GetMapping("/me")
    public List<ReservationDto> mine(@AuthenticationPrincipal Long userId) {
        return service.history(userId);
    }
}
