package com.satish.BMS.service;

import com.satish.BMS.dto.SeatRequest;
import com.satish.BMS.dto.SeatResponse;
import com.satish.BMS.entity.Screen;
import com.satish.BMS.entity.Seat;
import com.satish.BMS.enums.SeatType;
import com.satish.BMS.repository.ScreenRepository;
import com.satish.BMS.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;
    private final ScreenRepository screenRepository;

    public SeatResponse addSeat(SeatRequest request) {
        Screen screen = screenRepository.findById(request.getScreenId())
                .orElseThrow(() -> new IllegalArgumentException("Screen not found with id: " + request.getScreenId()));

        Seat seat = Seat.builder()
                .seatNumber(request.getSeatNumber())
                .row(request.getRow())
                .col(request.getCol())
                .seatType(request.getSeatType())
                .screen(screen)
                .build();

        Seat savedSeat = seatRepository.save(seat);
        return mapToSeatResponse(savedSeat, calculatePrice(savedSeat.getSeatType(), 200.0), false);
    }

    public List<SeatResponse> getAllSeats() {
        return seatRepository.findAll()
                .stream()
                .map(seat -> mapToSeatResponse(seat, calculatePrice(seat.getSeatType(), 200.0), false))
                .toList();
    }

    public SeatResponse getSeatById(Long id) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seat not found with id: " + id));
        return mapToSeatResponse(seat, calculatePrice(seat.getSeatType(), 200.0), false);
    }

    public List<SeatResponse> getSeatsByScreenId(Long screenId) {
        return seatRepository.findByScreenId(screenId)
                .stream()
                .map(seat -> mapToSeatResponse(seat, calculatePrice(seat.getSeatType(), 200.0), false))
                .toList();
    }

    // Pricing multiplier matching strictly: REGULAR, PREMIUM, VIP
    private double calculatePrice(SeatType seatType, double basePrice) {
        if (seatType == null) return basePrice;
        return switch (seatType) {
            case VIP -> basePrice * 1.5;      // 50% premium
            case PREMIUM -> basePrice * 1.25;  // 25% premium
            case REGULAR -> basePrice;         // Base rate
        };
    }

    private SeatResponse mapToSeatResponse(Seat seat, double calculatedPrice, boolean isBooked) {
        return SeatResponse.builder()
                .id(seat.getId())
                .seatNumber(seat.getSeatNumber())
                .row(seat.getRow()) // Changed from seat.getRowName() to match entity getter
                .col(seat.getCol()) // Use seat.getCol() if your entity field is named 'col'
                .seatType(seat.getSeatType())
                .price(calculatedPrice)
                .isBooked(isBooked)
                .build();
    }
}