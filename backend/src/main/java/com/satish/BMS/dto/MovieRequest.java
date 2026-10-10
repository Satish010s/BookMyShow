package com.satish.BMS.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MovieRequest {
    private String title;
    private String description;
    private String language;
    private String genre;
    private Integer durationMinutes;
    private Double rating;
    private LocalDate releaseDate;
    private String posterUrl;
}
