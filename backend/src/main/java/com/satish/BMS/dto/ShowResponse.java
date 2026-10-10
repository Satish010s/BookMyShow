package com.satish.BMS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowResponse {
    private Long id;
    private Long movieId;
    private String movieTitle;
    private String movieLanguage;
    private Long screenId;
    private String screenName;
    private Long theaterId;
    private String theaterName;
    private String cityName;
    private LocalDate showDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Double ticketPrice;
}