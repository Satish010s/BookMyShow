package com.satish.BMS.service;

import com.satish.BMS.dto.BookingRequest;
import com.satish.BMS.dto.BookingResponse;
import com.satish.BMS.dto.SeatResponse;
import com.satish.BMS.entity.*;
import com.satish.BMS.enums.BookingStatus;
import com.satish.BMS.enums.SeatType;
import com.satish.BMS.repository.BookingRepository;
import com.satish.BMS.repository.SeatRepository;
import com.satish.BMS.repository.ShowRepository;
import com.satish.BMS.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final ShowRepository showRepository;

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        // 1. Get currently authenticated user from SecurityContext (prevents user ID spoofing)
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found"));

        Show show = showRepository.findById(request.getShowId())
                .orElseThrow(() -> new IllegalArgumentException("Show not found with id: " + request.getShowId()));

        // 2. Fetch seats with Pessimistic Lock to prevent double-booking race conditions
        List<Seat> seats = seatRepository.findAllByIdIn(request.getSeatIds());
        if (seats.size() != request.getSeatIds().size()) {
            throw new IllegalArgumentException("Some requested seats do not exist");
        }

        // 3. Verify seat availability
        List<Long> alreadyBookedSeatIds = bookingRepository.findBookedSeatIdsByShowId(show.getId());
        for (Seat seat : seats) {
            if (alreadyBookedSeatIds.contains(seat.getId())) {
                throw new IllegalStateException("Seat " + seat.getSeatNumber() + " is already booked");
            }
        }

        double baseTicketPrice = show.getTicketPrice() != null ? show.getTicketPrice() : 0.0;
        double totalPrice = seats.stream()
                .mapToDouble(seat -> calculateSeatPrice(seat.getSeatType(), baseTicketPrice))
                .sum();

        Booking booking = Booking.builder()
                .user(user)
                .show(show)
                .seats(seats)
                .totalPrice(totalPrice)
                .status(BookingStatus.CONFIRMED)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(savedBooking);
    }

    public BookingResponse getBookingById(Long id) {
        Booking booking = getBookingEntityById(id);
        return mapToBookingResponse(booking);
    }

    public Booking getBookingEntityById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + id));

        // Security check: Ensure standard users can only view their own bookings
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isAdminOrManager = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));

        if (!isAdminOrManager && !booking.getUser().getEmail().equals(currentEmail)) {
            throw new AccessDeniedException("Unauthorized access to booking");
        }

        return booking;
    }

    public List<BookingResponse> getBookingByUser(Long userId) {
        return bookingRepository.findByUserId(userId)
                .stream()
                .map(this::mapToBookingResponse)
                .toList();
    }

    public List<BookingResponse> getMyBookings() {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found"));
        return getBookingByUser(user.getId());
    }

    public List<BookingResponse> getBookingByShow(Long showId) {
        return bookingRepository.findByShowId(showId)
                .stream()
                .map(this::mapToBookingResponse)
                .toList();
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = getBookingEntityById(bookingId); // Includes authorization check
        booking.setStatus(BookingStatus.CANCELLED);
        Booking savedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(savedBooking);
    }

    public List<SeatResponse> getAvailableSeats(Long showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new IllegalArgumentException("Show not found with id: " + showId));
        List<Seat> allSeats = seatRepository.findByScreenId(show.getScreen().getId());
        List<Long> bookedSeatIds = bookingRepository.findBookedSeatIdsByShowId(showId);
        double baseTicketPrice = show.getTicketPrice() != null ? show.getTicketPrice() : 0.0;

        return allSeats.stream()
                .filter(seat -> !bookedSeatIds.contains(seat.getId()))
                .map(seat -> SeatResponse.builder()
                        .id(seat.getId())
                        .seatNumber(seat.getSeatNumber())
                        .row(seat.getRow())
                        .col(seat.getCol())
                        .seatType(seat.getSeatType())
                        .price(calculateSeatPrice(seat.getSeatType(), baseTicketPrice))
                        .isBooked(false)
                        .build())
                .toList();
    }

    public List<BookingResponse> getAllBooking() {
        return bookingRepository.findAll()
                .stream()
                .map(this::mapToBookingResponse)
                .toList();
    }

    private double calculateSeatPrice(SeatType seatType, double basePrice) {
        if (seatType == null) return basePrice;
        return switch (seatType) {
            case VIP -> basePrice * 1.5;
            case PREMIUM -> basePrice * 1.25;
            case REGULAR -> basePrice;
        };
    }

    private BookingResponse mapToBookingResponse(Booking booking) {
        Show show = booking.getShow();
        Screen screen = show != null ? show.getScreen() : null;
        Theater theater = screen != null ? screen.getTheater() : null;
        Movie movie = show != null ? show.getMovie() : null;
        User user = booking.getUser();
        double baseTicketPrice = (show != null && show.getTicketPrice() != null) ? show.getTicketPrice() : 0.0;

        List<SeatResponse> seatResponses = (booking.getSeats() != null)
                ? booking.getSeats().stream().map(seat -> SeatResponse.builder()
                        .id(seat.getId())
                        .seatNumber(seat.getSeatNumber())
                        .row(seat.getRow())
                        .col(seat.getCol())
                        .seatType(seat.getSeatType())
                        .price(calculateSeatPrice(seat.getSeatType(), baseTicketPrice))
                        .isBooked(true)
                        .build()).toList()
                : List.of();

        LocalDateTime showStartTime = null;
        if (show != null && show.getShowDate() != null && show.getStartTime() != null) {
            showStartTime = LocalDateTime.of(show.getShowDate(), show.getStartTime());
        }

        return BookingResponse.builder()
                .bookingId(booking.getId())
                .userId(user != null ? user.getId() : null)
                .userName(user != null ? user.getName() : null)
                .movieTitle(movie != null ? movie.getTitle() : null)
                .theatreName(theater != null ? theater.getName() : null)
                .screenName(screen != null ? screen.getName() : null)
                .showStartTime(showStartTime)
                .totalPrice(booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0)
                .status(booking.getStatus())
                .bookedAt(booking.getBookedAt())
                .seats(seatResponses)
                .build();
    }
}