package com.pos.controller;

import com.pos.dto.response.InventorySummaryResponse;
import com.pos.dto.response.RevenueReportResponse;
import com.pos.dto.response.TopProductResponse;
import com.pos.service.ReportService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/revenue")
    public ResponseEntity<RevenueReportResponse> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(required = false) @Min(value = 1, message = "branchId must be greater than 0") Long branchId) {
        return ResponseEntity.ok(reportService.getRevenueReport(from, to, groupBy, branchId));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponse>> getTopProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "limit must be greater than or equal to 1") @Max(value = 100, message = "limit must be less than or equal to 100") int limit,
            @RequestParam(defaultValue = "quantity") String sortBy,
            @RequestParam(required = false) @Min(value = 1, message = "branchId must be greater than 0") Long branchId) {
        return ResponseEntity.ok(reportService.getTopProducts(from, to, limit, sortBy, branchId));
    }

    @GetMapping("/inventory-summary")
    public ResponseEntity<InventorySummaryResponse> getInventorySummary() {
        return ResponseEntity.ok(reportService.getInventorySummary());
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportReport(
            @RequestParam String type,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "limit must be greater than or equal to 1") @Max(value = 100, message = "limit must be less than or equal to 100") int limit,
            @RequestParam(defaultValue = "quantity") String sortBy,
            @RequestParam(required = false) @Min(value = 1, message = "branchId must be greater than 0") Long branchId) {
        if (!"csv".equalsIgnoreCase(format)) {
            throw new com.pos.exception.BadRequestException("Phase 3 supports csv export only");
        }

        String csvContent = reportService.exportReportCsv(type, from, to, groupBy, limit, sortBy, branchId);
        String filename = "pos-" + type.toLowerCase() + "-" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(csvContent);
    }
}

