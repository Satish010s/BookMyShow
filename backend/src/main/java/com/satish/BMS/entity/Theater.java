package com.satish.BMS.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Theaters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Theater {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Column(nullable = false)
    private String name;
    private String address;
    @ManyToOne
    @JoinColumn(name = "city_id",nullable = false)
   private  City city;
}
