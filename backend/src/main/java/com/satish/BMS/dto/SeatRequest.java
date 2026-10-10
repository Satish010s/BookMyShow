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
public class SeatRequest {
    private String seatNumber; // e.g., "A12"
    private String row;        // e.g., "A"
    private Integer col;       // e.g., 12
    private SeatType seatType; // e.g., VIP, PREMIUM, EXECUTIVE
    private Long screenId;
}