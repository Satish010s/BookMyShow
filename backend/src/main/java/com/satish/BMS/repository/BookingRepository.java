package com.satish.BMS.repository;

import com.satish.BMS.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking,Long> {
    List<Booking>findByUserId(Long userId);
    List<Booking>findByShowId(Long showId);
    //find all seats that are already booked  right-----
    // then write a method for checking it
    @Query("SELECT s.id FROM Booking b JOIN b.seats s WHERE b.show.id = :showId AND b.status = com.satish.BMS.enums.BookingStatus.CONFIRMED")
    List<Long> findBookedSeatIdsByShowId(@Param("showId") Long showId);
}
