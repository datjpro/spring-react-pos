package com.pos.services;

import com.pos.dtos.response.InventorySummaryResponse;
import com.pos.dtos.response.RevenueReportResponse;
import com.pos.dtos.response.TopProductResponse;

import java.time.Instant;
import java.util.List;

public interface ReportService {

    RevenueReportResponse getRevenueReport(Instant from, Instant to, String groupBy, Long branchId);

    List<TopProductResponse> getTopProducts(Instant from, Instant to, int limit, String sortBy, Long branchId);

    InventorySummaryResponse getInventorySummary();

    String exportReportCsv(String type, Instant from, Instant to, String groupBy, int limit, String sortBy,
            Long branchId);
}
