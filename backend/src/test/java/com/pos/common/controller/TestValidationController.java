package com.pos.common.controller;

import com.pos.common.dto.TestValidationRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestValidationController {

    @PostMapping("/test/validation")
    public ResponseEntity<Void> validate(@Valid @RequestBody TestValidationRequest request) {
        return ResponseEntity.ok().build();
    }
}
