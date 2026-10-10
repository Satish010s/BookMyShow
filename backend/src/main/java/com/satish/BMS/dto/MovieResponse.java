package com.satish.BMS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieResponse {
    private Long id;
    private String title;
    private String description;
    private String language;
    private String genre;
    private Integer durationMinutes;
    private Double rating;
    private LocalDate releaseDate;
    private String posterUrl;
}