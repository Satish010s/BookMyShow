package com.satish.BMS.dto;

import com.satish.BMS.enums.SeatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SeatResponse {
    private Long id;
    private String seatNumber;
    private String row;
    private Integer col;
    private SeatType seatType;
    private double price;        // Calculated based on show ticket price + seat type multiplier
    private boolean isBooked;    // Dynamic status for show seat selection screen
}