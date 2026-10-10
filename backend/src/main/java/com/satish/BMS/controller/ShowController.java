package com.satish.BMS.controller;

import com.satish.BMS.dto.ShowRequest;
import com.satish.BMS.dto.ShowResponse;
import com.satish.BMS.service.ShowService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shows") // Added /v1 prefix
@RequiredArgsConstructor
public class ShowController {

    private final ShowService showService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ShowResponse> addShow(@RequestBody ShowRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(showService.addShow(request));
    }

    @GetMapping
    public ResponseEntity<List<ShowResponse>> getAllShows() {
        return ResponseEntity.ok(showService.getAllShows());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowResponse> getShowById(@PathVariable Long id) {
        return ResponseEntity.ok(showService.getShowById(id));
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ShowResponse>> getShowsByMovie(@PathVariable Long movieId) { // Added missing @PathVariable
        return ResponseEntity.ok(showService.getShowsByMovie(movieId));
    }

    @GetMapping("/movie/{movieId}/date")
    public ResponseEntity<List<ShowResponse>> getShowsByMovieAndDate(
            @PathVariable Long movieId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(showService.getShowsByMovieAndDate(movieId, date));
    }

    @GetMapping("/screen/{screenId}")
    public ResponseEntity<List<ShowResponse>> getShowsByScreen(@PathVariable Long screenId) {
        return ResponseEntity.ok(showService.getShowsByScreen(screenId));
    }

    @GetMapping("/screen/{screenId}/date")
    public ResponseEntity<List<ShowResponse>> getShowsByScreenAndDate(
            @PathVariable Long screenId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(showService.getShowsByScreenAndDate(screenId, date));
    }
}