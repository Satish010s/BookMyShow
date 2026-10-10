package com.satish.BMS.entity;

import com.satish.BMS.enums.SeatType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "seats",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_screen_seat_number",
                        columnNames = {"screen_id", "seatNumber"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private String seatNumber; // e.g., "A12"

    @Column(name = "seat_row", nullable = false)
    private String row;       // e.g., "A"

    @Column(name = "seat_col", nullable = false)
    private Integer col;      // e.g., 12

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatType seatType; // e.g., VIP, PREMIUM, EXECUTIVE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;
}