package com.satish.BMS.repository;

import com.satish.BMS.entity.Seat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat,Long> {
    List<Seat>findByScreenId(Long screenId);
    // Prevents double-booking by locking selected seat rows until transaction completes
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<Seat> findAllByIdIn(List<Long> ids);
}
