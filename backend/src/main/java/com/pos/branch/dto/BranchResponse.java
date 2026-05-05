package com.pos.branch.dto;

public record BranchResponse(Long id, String code, String name, String address, boolean active) { }
