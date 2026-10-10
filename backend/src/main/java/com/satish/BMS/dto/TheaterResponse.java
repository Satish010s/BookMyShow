package com.satish.BMS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TheaterResponse {
    private Long id;
    private String name;
    private String address;
    private Long cityId;
    private String cityName;
    private String cityState;
}