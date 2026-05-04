package com.pos.report.controller;

import com.pos.report.dto.InventorySummaryResponse;
import com.pos.report.dto.RevenueReportResponse;
import com.pos.report.dto.TopProductResponse;
import com.pos.report.service.ReportService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
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
            @RequestParam(defaultValue = "day") String groupBy) {
        return ResponseEntity.ok(reportService.getRevenueReport(from, to, groupBy));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponse>> getTopProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "limit must be greater than or equal to 1") @Max(value = 100, message = "limit must be less than or equal to 100") int limit,
            @RequestParam(defaultValue = "quantity") String sortBy) {
        return ResponseEntity.ok(reportService.getTopProducts(from, to, limit, sortBy));
    }

    @GetMapping("/inventory-summary")
    public ResponseEntity<InventorySummaryResponse> getInventorySummary() {
        return ResponseEntity.ok(reportService.getInventorySummary());
    }
}
