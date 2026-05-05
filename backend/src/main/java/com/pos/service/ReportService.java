package com.pos.service;

import com.pos.dto.response.InventorySummaryResponse;
import com.pos.dto.response.RevenueReportResponse;
import com.pos.dto.response.TopProductResponse;

import java.time.Instant;
import java.util.List;

public interface ReportService {

    RevenueReportResponse getRevenueReport(Instant from, Instant to, String groupBy, Long branchId);

    List<TopProductResponse> getTopProducts(Instant from, Instant to, int limit, String sortBy, Long branchId);

    InventorySummaryResponse getInventorySummary();

    String exportReportCsv(String type, Instant from, Instant to, String groupBy, int limit, String sortBy,
            Long branchId);
}
