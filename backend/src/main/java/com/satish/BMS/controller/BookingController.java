package com.satish.BMS.controller;

import com.satish.BMS.dto.BookingRequest;
import com.satish.BMS.dto.BookingResponse;
import com.satish.BMS.dto.SeatResponse;
import com.satish.BMS.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // Any logged-in customer, manager, or admin can create a booking
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<BookingResponse> createBooking(@RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }

    // View specific booking details
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    // Get bookings belonging to a specific user
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<BookingResponse>> getBookingByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getBookingByUser(userId));
    }

    // Get bookings belonging to the currently authenticated user
    @GetMapping("/my-bookings")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<BookingResponse>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings());
    }

    // Managers and Admins view all bookings for a specific show
    @GetMapping("/show/{showId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<BookingResponse>> getBookingByShow(@PathVariable Long showId) {
        return ResponseEntity.ok(bookingService.getBookingByShow(showId));
    }

    // Cancel a booking
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    // Public / Customer endpoint to view available seats for a show
    @GetMapping("/show/{showId}/available-seats")
    public ResponseEntity<List<SeatResponse>> getAvailableSeat(@PathVariable Long showId) {
        return ResponseEntity.ok(bookingService.getAvailableSeats(showId));
    }

    // System-wide overview locked strictly to ADMIN
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBooking() {
        return ResponseEntity.ok(bookingService.getAllBooking());
    }
}