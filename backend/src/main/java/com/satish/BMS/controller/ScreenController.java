package com.satish.BMS.controller;

import com.satish.BMS.dto.ScreenRequest;
import com.satish.BMS.dto.ScreenResponse;
import com.satish.BMS.service.ScreenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/screens")
@RequiredArgsConstructor
public class ScreenController {

    private final ScreenService screenService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ScreenResponse> addScreen(@RequestBody ScreenRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(screenService.addScreen(request));
    }

    @GetMapping
    public ResponseEntity<List<ScreenResponse>> getAllScreen() {
        return ResponseEntity.ok(screenService.getAllScreen());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreenResponse> getScreenById(@PathVariable Long id) {
        return ResponseEntity.ok(screenService.getScreenById(id));
    }

    @GetMapping("/theater/{theaterId}")
    public ResponseEntity<List<ScreenResponse>> getScreenByTheaterId(@PathVariable Long theaterId) {
        return ResponseEntity.ok(screenService.getScreenByTheaterId(theaterId));
    }
}
