package com.satish.BMS.controller;

import com.satish.BMS.dto.TheaterRequest;
import com.satish.BMS.dto.TheaterResponse;
import com.satish.BMS.service.TheaterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/theaters")
@RequiredArgsConstructor
public class TheaterController {

    private final TheaterService theaterService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TheaterResponse> addTheater(@RequestBody TheaterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(theaterService.addTheater(request));
    }

    @GetMapping
    public ResponseEntity<List<TheaterResponse>> getAllTheater() {
        return ResponseEntity.ok(theaterService.getAllTheater());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TheaterResponse> getTheaterById(@PathVariable Long id) {
        return ResponseEntity.ok(theaterService.getTheaterById(id));
    }

    @GetMapping("/city/{cityId}")
    public ResponseEntity<List<TheaterResponse>> getTheaterByCityId(@PathVariable Long cityId) {
        return ResponseEntity.ok(theaterService.getTheaterByCity(cityId));
    }
}
