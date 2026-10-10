package com.satish.BMS.controller;

import com.satish.BMS.dto.SeatRequest;
import com.satish.BMS.dto.SeatResponse;
import com.satish.BMS.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SeatResponse> addSeat(@RequestBody SeatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(seatService.addSeat(request));
    }

    @GetMapping
    public ResponseEntity<List<SeatResponse>> getAllSeats() {
        return ResponseEntity.ok(seatService.getAllSeats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeatResponse> getSeatById(@PathVariable Long id) {
        return ResponseEntity.ok(seatService.getSeatById(id));
    }

    @GetMapping("/screen/{screenId}")
    public ResponseEntity<List<SeatResponse>> getSeatsByScreenId(@PathVariable Long screenId) {
        return ResponseEntity.ok(seatService.getSeatsByScreenId(screenId));
    }
}