package com.satish.BMS.service;

import com.satish.BMS.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. If no Bearer token in header, pass request to next filter in chain
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract JWT token from "Bearer <token>"
        jwt = authHeader.substring(7);
        userEmail = jwtUtil.extractUsername(jwt);

        // 3. If email extracted and user is not already authenticated in this thread
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Load user details (includes authorities/roles)
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 4. Validate token against database user details
            if (jwtUtil.isTokenValid(jwt, userDetails)) {

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities() // Passes ROLE_USER, ROLE_ADMIN, ROLE_MANAGER
                );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 5. Set security context -> User is officially authenticated for this request
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 6. Continue filter chain
        filterChain.doFilter(request, response);
    }
}