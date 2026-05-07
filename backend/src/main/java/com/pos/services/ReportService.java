package com.pos.services;

import com.pos.dtos.response.InventorySummaryResponse;
import com.pos.dtos.response.ProfitReportResponse;
import com.pos.dtos.response.RevenueReportResponse;
import com.pos.dtos.response.PurchaseSummaryResponse;
import com.pos.dtos.response.SalesSummaryResponse;
import com.pos.dtos.response.StockCardReportResponse;
import com.pos.dtos.response.TopProductResponse;

import java.time.Instant;
import java.util.List;

public interface ReportService {

    RevenueReportResponse getRevenueReport(Instant from, Instant to, String groupBy, Long branchId);

    List<TopProductResponse> getTopProducts(Instant from, Instant to, int limit, String sortBy, Long branchId);

    InventorySummaryResponse getInventorySummary();

    ProfitReportResponse getProfitReport(Instant from, Instant to, String groupBy, Long branchId);

    StockCardReportResponse getStockCard(Long productId, Long branchId, Instant from, Instant to);

    PurchaseSummaryResponse getPurchaseSummary(Instant from, Instant to, Long supplierId, Long branchId);

    SalesSummaryResponse getSalesSummary(Instant from, Instant to, Long branchId, String createdBy);

    String exportReportCsv(String type, Instant from, Instant to, String groupBy, int limit, String sortBy,
            Long branchId, Long productId, Long supplierId, String createdBy);
}
