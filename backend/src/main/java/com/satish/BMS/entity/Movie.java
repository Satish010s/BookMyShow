package com.satish.BMS.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Column(nullable = false)
    private String title;
    private String description;
    private String language;
    private String genre;
    private Integer durationMinutes;
    private Double rating ;
    private LocalDate releaseDate;
    private String  posterUrl;
}
