package com.satish.BMS.service;

import com.satish.BMS.dto.MovieRequest;
import com.satish.BMS.dto.MovieResponse;
import com.satish.BMS.entity.Movie;
import com.satish.BMS.repository.MovieRepository;
import com.satish.BMS.repository.ShowRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final ShowRepository showRepository;

    public MovieResponse addMovie(MovieRequest request) {
        Movie movie = Movie.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .language(request.getLanguage())
                .genre(request.getGenre())
                .durationMinutes(request.getDurationMinutes())
                .rating(request.getRating())
                .releaseDate(request.getReleaseDate())
                .posterUrl(request.getPosterUrl())
                .build();

        Movie savedMovie = movieRepository.save(movie);
        return mapToMovieResponse(savedMovie);
    }

    public List<MovieResponse> getAllMovies() {
        return movieRepository.findAll()
                .stream()
                .map(this::mapToMovieResponse)
                .toList();
    }

    public MovieResponse getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));
        return mapToMovieResponse(movie);
    }

    public List<MovieResponse> getMoviesByGenre(String genre) {
        return movieRepository.findByGenre(genre)
                .stream()
                .map(this::mapToMovieResponse)
                .toList();
    }

    public List<MovieResponse> getMoviesByLanguage(String language) {
        return movieRepository.findByLanguage(language)
                .stream()
                .map(this::mapToMovieResponse)
                .toList();
    }

    public List<MovieResponse> searchByTitle(String title) {
        return movieRepository.findByTitleContainingIgnoreCase(title)
                .stream()
                .map(this::mapToMovieResponse)
                .toList();
    }

    public MovieResponse updateMovie(Long id, MovieRequest request) {
        Movie existingMovie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + id));

        existingMovie.setTitle(request.getTitle());
        existingMovie.setDescription(request.getDescription());
        existingMovie.setLanguage(request.getLanguage());
        existingMovie.setGenre(request.getGenre()); // Fixed: setGenre instead of setDescription
        existingMovie.setDurationMinutes(request.getDurationMinutes());
        existingMovie.setRating(request.getRating());
        existingMovie.setReleaseDate(request.getReleaseDate());
        existingMovie.setPosterUrl(request.getPosterUrl());

        Movie updatedMovie = movieRepository.save(existingMovie);
        return mapToMovieResponse(updatedMovie);
    }
    @Transactional
    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new IllegalArgumentException("Movie not found with id: " + id);
        }
        showRepository.deleteByMovieId(id);
        movieRepository.deleteById(id);
    }

    // Helper method to convert Movie JPA Entity to MovieResponse DTO
    private MovieResponse mapToMovieResponse(Movie movie) {
        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .language(movie.getLanguage())
                .genre(movie.getGenre())
                .durationMinutes(movie.getDurationMinutes())
                .rating(movie.getRating())
                .releaseDate(movie.getReleaseDate())
                .posterUrl(movie.getPosterUrl())
                .build();
    }
}