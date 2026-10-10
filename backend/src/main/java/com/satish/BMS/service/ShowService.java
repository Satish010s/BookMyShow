package com.satish.BMS.service;

import com.satish.BMS.dto.ShowRequest;
import com.satish.BMS.dto.ShowResponse;
import com.satish.BMS.entity.Movie;
import com.satish.BMS.entity.Screen;
import com.satish.BMS.entity.Show;
import com.satish.BMS.repository.MovieRepository;
import com.satish.BMS.repository.ScreenRepository;
import com.satish.BMS.repository.ShowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowService {

    private final ShowRepository showRepository;
    private final MovieRepository movieRepository;
    private final ScreenRepository screenRepository;

    public ShowResponse addShow(ShowRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + request.getMovieId()));

        Screen screen = screenRepository.findById(request.getScreenId())
                .orElseThrow(() -> new IllegalArgumentException("Screen not found with id: " + request.getScreenId()));

        Show show = Show.builder()
                .movie(movie)
                .screen(screen)
                .showDate(request.getShowDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .ticketPrice(request.getTicketPrice())
                .build();

        Show savedShow = showRepository.save(show);
        return mapToShowResponse(savedShow);
    }

    public List<ShowResponse> getAllShows() {
        return showRepository.findAll()
                .stream()
                .map(this::mapToShowResponse)
                .toList();
    }

    public ShowResponse getShowById(Long id) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Show not found with id: " + id));
        return mapToShowResponse(show);
    }

    public List<ShowResponse> getShowsByMovie(Long movieId) {
        return showRepository.findByMovieId(movieId)
                .stream()
                .map(this::mapToShowResponse)
                .toList();
    }

    public List<ShowResponse> getShowsByMovieAndDate(Long movieId, LocalDate date) {
        return showRepository.findByMovieIdAndShowDate(movieId, date)
                .stream()
                .map(this::mapToShowResponse)
                .toList();
    }

    public List<ShowResponse> getShowsByScreen(Long screenId) {
        return showRepository.findByScreenId(screenId)
                .stream()
                .map(this::mapToShowResponse)
                .toList();
    }

    public List<ShowResponse> getShowsByScreenAndDate(Long screenId, LocalDate date) {
        return showRepository.findByScreenIdAndShowDate(screenId, date)
                .stream()
                .map(this::mapToShowResponse)
                .toList();
    }

    // Helper: Maps Show entity and associated nested entities to ShowResponse DTO
    private ShowResponse mapToShowResponse(Show show) {
        Movie movie = show.getMovie();
        Screen screen = show.getScreen();

        return ShowResponse.builder()
                .id(show.getId())
                .movieId(movie != null ? movie.getId() : null)
                .movieTitle(movie != null ? movie.getTitle() : null)
                .movieLanguage(movie != null ? movie.getLanguage() : null)
                .screenId(screen != null ? screen.getId() : null)
                .screenName(screen != null ? screen.getName() : null)
                .theaterId((screen != null && screen.getTheater() != null) ? screen.getTheater().getId() : null)
                .theaterName((screen != null && screen.getTheater() != null) ? screen.getTheater().getName() : null)
                .cityName((screen != null && screen.getTheater() != null && screen.getTheater().getCity() != null)
                        ? screen.getTheater().getCity().getName() : null) // Adjust city method based on your City entity
                .showDate(show.getShowDate())
                .startTime(show.getStartTime())
                .endTime(show.getEndTime())
                .ticketPrice(show.getTicketPrice())
                .build();
    }
}