package com.pos.controllers;

import com.pos.dtos.response.*;
import com.pos.services.ReportService;
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
            @RequestParam(required = false) @Min(1) Long branchId) {
        return ResponseEntity.ok(reportService.getRevenueReport(from, to, groupBy, branchId));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponse>> getTopProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue = "quantity") String sortBy,
            @RequestParam(required = false) @Min(1) Long branchId) {
        return ResponseEntity.ok(reportService.getTopProducts(from, to, limit, sortBy, branchId));
    }

    @GetMapping("/inventory-summary")
    public ResponseEntity<InventorySummaryResponse> getInventorySummary() {
        return ResponseEntity.ok(reportService.getInventorySummary());
    }

    @GetMapping("/profit")
    public ResponseEntity<ProfitReportResponse> getProfitReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(required = false) @Min(1) Long branchId) {
        return ResponseEntity.ok(reportService.getProfitReport(from, to, groupBy, branchId));
    }

    @GetMapping("/stock-card")
    public ResponseEntity<StockCardReportResponse> getStockCard(
            @RequestParam @Min(1) Long productId,
            @RequestParam @Min(1) Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ResponseEntity.ok(reportService.getStockCard(productId, branchId, from, to));
    }

    @GetMapping("/purchase-summary")
    public ResponseEntity<PurchaseSummaryResponse> getPurchaseSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) @Min(1) Long supplierId,
            @RequestParam(required = false) @Min(1) Long branchId) {
        return ResponseEntity.ok(reportService.getPurchaseSummary(from, to, supplierId, branchId));
    }

    @GetMapping("/sales-summary")
    public ResponseEntity<SalesSummaryResponse> getSalesSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) @Min(1) Long branchId,
            @RequestParam(required = false) String createdBy) {
        return ResponseEntity.ok(reportService.getSalesSummary(from, to, branchId, createdBy));
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportReport(
            @RequestParam String type,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue = "quantity") String sortBy,
            @RequestParam(required = false) @Min(1) Long branchId,
            @RequestParam(required = false) @Min(1) Long productId,
            @RequestParam(required = false) @Min(1) Long supplierId,
            @RequestParam(required = false) String createdBy) {
        if (!"csv".equalsIgnoreCase(format)) {
            throw new com.pos.common.exception.BadRequestException("Only csv export is supported");
        }

        String csvContent = reportService.exportReportCsv(type, from, to, groupBy, limit, sortBy, branchId, productId, supplierId, createdBy);
        String filename = "pos-" + type.toLowerCase() + "-" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(csvContent);
    }
}