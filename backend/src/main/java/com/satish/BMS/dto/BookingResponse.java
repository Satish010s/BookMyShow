package com.satish.BMS.dto;

import com.satish.BMS.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {
    private Long bookingId;
    private Long userId;
    private String userName;
    private String movieTitle;
    private String theatreName;
    private String screenName;
    private LocalDateTime showStartTime;
    private double totalPrice;
    private BookingStatus status;
    private LocalDateTime bookedAt;
    private List<SeatResponse> seats;
}