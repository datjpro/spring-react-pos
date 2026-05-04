package com.pos.report.service;

import com.pos.common.exception.BadRequestException;
import com.pos.order.repository.OrderItemRepository;
import com.pos.order.repository.OrderRepository;
import com.pos.product.repository.ProductRepository;
import com.pos.report.dto.InventorySummaryResponse;
import com.pos.report.dto.RevenueReportResponse;
import com.pos.report.dto.TopProductResponse;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    void shouldReturnRevenueForCompletedOrdersOnly() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");

        when(orderRepository.summarizeRevenueByDate(any(), any(), any()))
                .thenReturn(List.of(
                        new Object[]{Date.valueOf(LocalDate.of(2026, 5, 1)), new BigDecimal("120000"), 2L},
                        new Object[]{Date.valueOf(LocalDate.of(2026, 5, 2)), new BigDecimal("80000"), 1L}
                ));

        RevenueReportResponse response = reportService.getRevenueReport(from, to, "day");

        assertEquals(new BigDecimal("200000"), response.totalRevenue());
        assertEquals(3L, response.totalOrders());
        assertEquals(2, response.data().size());
    }

    @Test
    void shouldReturnTopProductsSortedByQuantity() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");

        when(orderItemRepository.summarizeTopProducts(any(), any(), any()))
                .thenReturn(List.of(
                        new Object[]{1L, "SP-001", "Coffee", 5L, new BigDecimal("100000")},
                        new Object[]{2L, "SP-002", "Milk Tea", 8L, new BigDecimal("160000")}
                ));

        List<TopProductResponse> response = reportService.getTopProducts(from, to, 10, "quantity");

        assertEquals(2, response.size());
        assertEquals("SP-002", response.get(0).sku());
        assertEquals(8L, response.get(0).totalQuantity());
    }

    @Test
    void shouldReturnInventorySummary() {
        when(productRepository.summarizeInventoryTotals()).thenReturn(new Object[]{3L, 18L});
        when(productRepository.countByActiveTrue()).thenReturn(2L);
        when(productRepository.countByActiveTrueAndStockLessThanEqual(10)).thenReturn(1L);
        when(productRepository.countByActiveTrueAndStock(0)).thenReturn(1L);

        InventorySummaryResponse response = reportService.getInventorySummary();

        assertEquals(3L, response.totalProducts());
        assertEquals(2L, response.activeProducts());
        assertEquals(18L, response.totalStock());
        assertEquals(1L, response.lowStockProducts());
        assertEquals(1L, response.outOfStockProducts());
    }

    @Test
    void shouldRejectInvalidSortBy() {
        Instant from = Instant.parse("2026-05-01T00:00:00Z");
        Instant to = Instant.parse("2026-05-31T23:59:59Z");

        assertThrows(BadRequestException.class, () -> reportService.getTopProducts(from, to, 10, "name"));
    }
}
