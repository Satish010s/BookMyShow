package com.satish.BMS.service;

import com.satish.BMS.dto.ScreenRequest;
import com.satish.BMS.dto.ScreenResponse;
import com.satish.BMS.entity.Screen;
import com.satish.BMS.entity.Theater;
import com.satish.BMS.repository.ScreenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScreenService {

    private final ScreenRepository screenRepository;
    private final TheaterService theaterService;

    public ScreenResponse addScreen(ScreenRequest request) {
        Theater theater = theaterService.getTheaterEntityById(request.getTheaterId());
        Screen screen = Screen.builder()
                .name(request.getName())
                .totalSeats(request.getTotalSeats())
                .theater(theater)
                .build();
        Screen savedScreen = screenRepository.save(screen);
        return mapToScreenResponse(savedScreen);
    }

    public List<ScreenResponse> getAllScreen() {
        return screenRepository.findAll()
                .stream()
                .map(this::mapToScreenResponse)
                .toList();
    }

    public ScreenResponse getScreenById(Long id) {
        Screen screen = getScreenEntityById(id);
        return mapToScreenResponse(screen);
    }

    public Screen getScreenEntityById(Long id) {
        return screenRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Screen not found with id: " + id));
    }

    public List<ScreenResponse> getScreenByTheaterId(Long theaterId) {
        return screenRepository.findByTheaterId(theaterId)
                .stream()
                .map(this::mapToScreenResponse)
                .toList();
    }

    private ScreenResponse mapToScreenResponse(Screen screen) {
        return ScreenResponse.builder()
                .id(screen.getId())
                .name(screen.getName())
                .totalSeats(screen.getTotalSeats())
                .theaterId(screen.getTheater() != null ? screen.getTheater().getId() : null)
                .theaterName(screen.getTheater() != null ? screen.getTheater().getName() : null)
                .build();
    }
}
