package com.pos.dto.request;

import jakarta.validation.constraints.*;

public record SupplierRequest(
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 255) String name,
        @Size(max = 100) String phone,
        @Email @Size(max = 255) String email,
        @Size(max = 500) String address
) { }
