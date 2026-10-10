package com.satish.BMS.service;

import com.satish.BMS.dto.TheaterRequest;
import com.satish.BMS.dto.TheaterResponse;
import com.satish.BMS.entity.City;
import com.satish.BMS.entity.Theater;
import com.satish.BMS.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TheaterService {

    private final TheaterRepository theaterRepository;
    private final CityService cityService;

    public TheaterResponse addTheater(TheaterRequest request) {
        City city = cityService.getCityEntityById(request.getCityId());
        Theater theater = Theater.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(city)
                .build();
        Theater savedTheater = theaterRepository.save(theater);
        return mapToTheaterResponse(savedTheater);
    }

    public List<TheaterResponse> getAllTheater() {
        return theaterRepository.findAll()
                .stream()
                .map(this::mapToTheaterResponse)
                .toList();
    }

    public TheaterResponse getTheaterById(Long id) {
        Theater theater = getTheaterEntityById(id);
        return mapToTheaterResponse(theater);
    }

    public Theater getTheaterEntityById(Long id) {
        return theaterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Theater not found with id: " + id));
    }

    public List<TheaterResponse> getTheaterByCity(Long cityId) {
        return theaterRepository.findByCityId(cityId)
                .stream()
                .map(this::mapToTheaterResponse)
                .toList();
    }

    private TheaterResponse mapToTheaterResponse(Theater theater) {
        return TheaterResponse.builder()
                .id(theater.getId())
                .name(theater.getName())
                .address(theater.getAddress())
                .cityId(theater.getCity() !=null ? theater.getCity().getId() :null)
                .cityName(theater.getName() !=null? theater.getCity().getName() :null)
                .cityState(theater.getName()!=null ? theater.getCity().getState():null)
                .build();
    }
}
