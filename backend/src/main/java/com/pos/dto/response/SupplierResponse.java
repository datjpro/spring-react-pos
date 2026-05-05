package com.pos.dto.response;

public record SupplierResponse(Long id, String code, String name, String phone, String email, String address, boolean active) { }
