package com.satish.BMS.repository;

import com.satish.BMS.entity.Theater;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TheaterRepository extends JpaRepository<Theater,Long> {
    List<Theater>findByCityId(Long cityId);
}
