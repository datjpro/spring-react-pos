package com.pos.report.service;

import com.pos.report.dto.InventorySummaryResponse;
import com.pos.report.dto.RevenueReportResponse;
import com.pos.report.dto.TopProductResponse;

import java.time.Instant;
import java.util.List;

public interface ReportService {

    RevenueReportResponse getRevenueReport(Instant from, Instant to, String groupBy);

    List<TopProductResponse> getTopProducts(Instant from, Instant to, int limit, String sortBy);

    InventorySummaryResponse getInventorySummary();

    String exportReportCsv(String type, Instant from, Instant to, String groupBy, int limit, String sortBy);
}
