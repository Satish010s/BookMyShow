package com.satish.BMS.service;

import com.satish.BMS.dto.CityRequest;
import com.satish.BMS.dto.CityResponse;
import com.satish.BMS.entity.City;
import com.satish.BMS.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CityService {

    private final CityRepository cityRepository;

    public CityResponse addCity(CityRequest request) {
        City city = City.builder()
                .name(request.getName())
                .state(request.getState())
                .build();
        City savedCity = cityRepository.save(city);
        return mapToCityResponse(savedCity);
    }

    public List<CityResponse> getAllCities() {
        return cityRepository.findAll()
                .stream()
                .map(this::mapToCityResponse)
                .toList();
    }

    public CityResponse getCityById(Long id) {
        City city = getCityEntityById(id);
        return mapToCityResponse(city);
    }

    public City getCityEntityById(Long id) {
        return cityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("City not found with id: " + id));
    }

    private CityResponse mapToCityResponse(City city) {
        return CityResponse.builder()
                .id(city.getId())
                .name(city.getName())
                .state(city.getState())
                .build();
    }
}
