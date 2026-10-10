package com.satish.BMS.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

@Getter@Service@NoArgsConstructor@AllArgsConstructor
public class AuthRequest {
    private String email;
    private String password;
}
