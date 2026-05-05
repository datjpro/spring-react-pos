package com.pos.controllers;

import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.dtos.response.InventorySummaryResponse;
import com.pos.dtos.response.RevenueDataPoint;
import com.pos.dtos.response.RevenueReportResponse;
import com.pos.dtos.response.TopProductResponse;
import com.pos.services.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {
    @Mock private ReportService reportService;
    @InjectMocks private ReportController reportController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reportController).setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void shouldGetRevenueReportSuccessfully() throws Exception {
        RevenueReportResponse response = new RevenueReportResponse(
                Instant.parse("2026-05-01T00:00:00Z"),
                Instant.parse("2026-05-31T23:59:59Z"),
                "day",
                new BigDecimal("200000"),
                3L,
                List.of(new RevenueDataPoint(LocalDate.of(2026, 5, 1), new BigDecimal("200000"), 3L))
        );
        when(reportService.getRevenueReport(Instant.parse("2026-05-01T00:00:00Z"), Instant.parse("2026-05-31T23:59:59Z"), "day", 1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/reports/revenue").param("from", "2026-05-01T00:00:00Z").param("to", "2026-05-31T23:59:59Z").param("groupBy", "day").param("branchId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue").value(200000));
    }

    @Test
    void shouldGetTopProductsSuccessfully() throws Exception {
        when(reportService.getTopProducts(Instant.parse("2026-05-01T00:00:00Z"), Instant.parse("2026-05-31T23:59:59Z"), 10, "quantity", 2L))
                .thenReturn(List.of(new TopProductResponse(1L, "SP-001", "Coffee", 8L, new BigDecimal("160000"))));

        mockMvc.perform(get("/api/v1/reports/top-products").param("from", "2026-05-01T00:00:00Z").param("to", "2026-05-31T23:59:59Z").param("limit", "10").param("sortBy", "quantity").param("branchId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sku").value("SP-001"));
    }

    @Test
    void shouldGetInventorySummarySuccessfully() throws Exception {
        when(reportService.getInventorySummary()).thenReturn(new InventorySummaryResponse(3L, 2L, 18L, 1L, 1L));
        mockMvc.perform(get("/api/v1/reports/inventory-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outOfStockProducts").value(1));
    }

    @Test
    void shouldExportRevenueCsvSuccessfully() throws Exception {
        when(reportService.exportReportCsv("revenue", Instant.parse("2026-05-01T00:00:00Z"), Instant.parse("2026-05-31T23:59:59Z"), "day", 10, "quantity", 3L))
                .thenReturn("groupBy,totalRevenue,totalOrders\nday,100000,1\n");
        mockMvc.perform(get("/api/v1/reports/export").param("type", "revenue").param("format", "csv").param("from", "2026-05-01T00:00:00Z").param("to", "2026-05-31T23:59:59Z").param("groupBy", "day").param("limit", "10").param("sortBy", "quantity").param("branchId", "3"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("pos-revenue-")));
    }
}
