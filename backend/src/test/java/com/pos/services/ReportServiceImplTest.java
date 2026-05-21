package com.pos.services;

import com.pos.common.exception.BadRequestException;
import com.pos.dtos.response.InventorySummaryResponse;
import com.pos.dtos.response.PurchaseSummaryResponse;
import com.pos.dtos.response.RevenueReportResponse;
import com.pos.dtos.response.SalesSummaryResponse;
import com.pos.dtos.response.TopProductResponse;
import com.pos.repositories.*;
import com.pos.services.impl.ReportServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private SaleItemRepository saleItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private BranchProductStockRepository branchProductStockRepository;
    @Mock
    private PurchaseRepository purchaseRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    void shouldReturnRevenueFromSalesOnly() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");
        when(saleItemRepository.summarizeRevenueByDate(any(), any(), any(), isNull()))
                .thenReturn(List.of(
                        new Object[]{Date.valueOf(LocalDate.of(2026, 5, 1)), new BigDecimal("120000"), 2L},
                        new Object[]{Date.valueOf(LocalDate.of(2026, 5, 2)), new BigDecimal("80000"), 1L}
                ));

        RevenueReportResponse response = reportService.getRevenueReport(from, to, "day", null);

        assertEquals(new BigDecimal("200000"), response.totalRevenue());
        assertEquals(3L, response.totalOrders());
    }

    @Test
    void shouldReturnTopProductsSortedByRevenue() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");
        when(saleItemRepository.summarizeTopProducts(any(), any(), any(), isNull()))
                .thenReturn(List.of(
                        new Object[]{1L, "SP-001", "Coffee", 5L, new BigDecimal("100000")},
                        new Object[]{2L, "SP-002", "Milk Tea", 8L, new BigDecimal("160000")}
                ));

        List<TopProductResponse> response = reportService.getTopProducts(from, to, 10, "revenue", null);

        assertEquals("SP-002", response.get(0).sku());
        assertEquals(new BigDecimal("160000"), response.get(0).totalRevenue());
    }

    @Test
    void shouldReturnInventorySummary() {
        when(branchProductStockRepository.summarizeInventoryByBranchStock(10)).thenReturn(new Object[]{3L, 18L, 1L, 1L});
        when(productRepository.count()).thenReturn(3L);
        when(productRepository.countByActiveTrue()).thenReturn(2L);

        InventorySummaryResponse response = reportService.getInventorySummary();

        assertEquals(3L, response.totalProducts());
        assertEquals(18L, response.totalStock());
    }

    @Test
    void shouldReturnInventorySummaryWhenRepositoryWrapsAggregateRow() {
        when(branchProductStockRepository.summarizeInventoryByBranchStock(10)).thenReturn(new Object[]{new Object[]{3L, 18L, 1L, 1L}});
        when(productRepository.count()).thenReturn(3L);
        when(productRepository.countByActiveTrue()).thenReturn(2L);

        InventorySummaryResponse response = reportService.getInventorySummary();

        assertEquals(3L, response.totalProducts());
        assertEquals(18L, response.totalStock());
    }

    @Test
    void shouldReturnPurchaseSummaryWhenRepositoryWrapsAggregateRow() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");
        when(purchaseRepository.summarizePurchases(from, to, 1L, 2L))
                .thenReturn(new Object[]{new Object[]{4L, 25L, new BigDecimal("300000")}});

        PurchaseSummaryResponse response = reportService.getPurchaseSummary(from, to, 1L, 2L);

        assertEquals(4L, response.totalPurchases());
        assertEquals(25L, response.totalQuantity());
        assertEquals(new BigDecimal("300000"), response.totalAmount());
    }

    @Test
    void shouldReturnPurchaseSummaryFromFlatAggregateRow() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");
        when(purchaseRepository.summarizePurchases(from, to, 1L, 2L))
                .thenReturn(new Object[]{4L, 25L, new BigDecimal("300000")});

        PurchaseSummaryResponse response = reportService.getPurchaseSummary(from, to, 1L, 2L);

        assertEquals(4L, response.totalPurchases());
        assertEquals(25L, response.totalQuantity());
        assertEquals(new BigDecimal("300000"), response.totalAmount());
    }

    @Test
    void shouldReturnSalesSummaryWhenRepositoryWrapsAggregateRow() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");
        when(saleItemRepository.summarizeSales(any(), eq(from), eq(to), eq(2L), eq("admin")))
                .thenReturn(new Object[]{new Object[]{5L, 12L, new BigDecimal("450000")}});

        SalesSummaryResponse response = reportService.getSalesSummary(from, to, 2L, "admin");

        assertEquals(5L, response.totalSales());
        assertEquals(12L, response.totalQuantity());
        assertEquals(new BigDecimal("450000"), response.totalAmount());
    }

    @Test
    void shouldReturnSalesSummaryFromFlatAggregateRow() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");
        when(saleItemRepository.summarizeSales(any(), eq(from), eq(to), eq(2L), eq("admin")))
                .thenReturn(new Object[]{5L, 12L, new BigDecimal("450000")});

        SalesSummaryResponse response = reportService.getSalesSummary(from, to, 2L, "admin");

        assertEquals(5L, response.totalSales());
        assertEquals(12L, response.totalQuantity());
        assertEquals(new BigDecimal("450000"), response.totalAmount());
    }

    @Test
    void shouldExportRevenueCsv() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");
        when(saleItemRepository.summarizeRevenueByDate(any(), any(), any(), eq(1L)))
                .thenReturn(List.<Object[]>of(new Object[]{Date.valueOf(LocalDate.of(2026, 5, 1)), new BigDecimal("120000"), 2L}));

        String csv = reportService.exportReportCsv("revenue", from, to, "day", 10, "quantity", 1L, null, null, null);

        assertTrue(csv.contains("groupBy,totalRevenue,totalOrders"));
    }

    @Test
    void shouldRejectInvalidSortBy() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");
        assertThrows(BadRequestException.class, () -> reportService.getTopProducts(from, to, 10, "name", null));
    }
}
