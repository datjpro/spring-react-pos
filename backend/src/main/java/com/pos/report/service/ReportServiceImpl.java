package com.pos.report.service;

import com.pos.common.enums.OrderStatus;
import com.pos.common.exception.BadRequestException;
import com.pos.order.repository.OrderItemRepository;
import com.pos.order.repository.OrderRepository;
import com.pos.product.repository.ProductRepository;
import com.pos.report.dto.InventorySummaryResponse;
import com.pos.report.dto.RevenueDataPoint;
import com.pos.report.dto.RevenueReportResponse;
import com.pos.report.dto.TopProductResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

@Service
public class ReportServiceImpl implements ReportService {

    private static final int DEFAULT_LOW_STOCK_THRESHOLD = 10;
    private static final int MAX_TOP_PRODUCT_LIMIT = 100;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    public ReportServiceImpl(OrderRepository orderRepository,
                             OrderItemRepository orderItemRepository,
                             ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
    }

    @Override
    public RevenueReportResponse getRevenueReport(Instant from, Instant to, String groupBy) {
        validateDateRange(from, to);
        if (!"day".equalsIgnoreCase(groupBy)) {
            throw new BadRequestException("Phase 2 supports groupBy=day only");
        }

        List<RevenueDataPoint> dataPoints = orderRepository.summarizeRevenueByDate(OrderStatus.COMPLETED, from, to)
                .stream()
                .map(this::mapRevenueDataPoint)
                .toList();

        BigDecimal totalRevenue = dataPoints.stream()
                .map(RevenueDataPoint::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Long totalOrders = dataPoints.stream()
                .map(RevenueDataPoint::orderCount)
                .reduce(0L, Long::sum);

        return new RevenueReportResponse(from, to, groupBy.toLowerCase(), totalRevenue, totalOrders, dataPoints);
    }

    @Override
    public List<TopProductResponse> getTopProducts(Instant from, Instant to, int limit, String sortBy) {
        validateDateRange(from, to);
        if (limit < 1 || limit > MAX_TOP_PRODUCT_LIMIT) {
            throw new BadRequestException("limit must be between 1 and 100");
        }
        if (!"quantity".equalsIgnoreCase(sortBy) && !"revenue".equalsIgnoreCase(sortBy)) {
            throw new BadRequestException("sortBy must be quantity or revenue");
        }

        Comparator<TopProductResponse> comparator = "revenue".equalsIgnoreCase(sortBy)
                ? Comparator.comparing(TopProductResponse::totalRevenue)
                : Comparator.comparing(TopProductResponse::totalQuantity);

        return orderItemRepository.summarizeTopProducts(OrderStatus.COMPLETED, from, to)
                .stream()
                .map(this::mapTopProduct)
                .sorted(comparator.reversed())
                .limit(limit)
                .toList();
    }

    @Override
    public InventorySummaryResponse getInventorySummary() {
        Object[] totals = productRepository.summarizeInventoryTotals();
        return new InventorySummaryResponse(
                toLong(totals[0]),
                productRepository.countByActiveTrue(),
                toLong(totals[1]),
                productRepository.countByActiveTrueAndStockLessThanEqual(DEFAULT_LOW_STOCK_THRESHOLD),
                productRepository.countByActiveTrueAndStock(0)
        );
    }

    private void validateDateRange(Instant from, Instant to) {
        if (from == null || to == null) {
            throw new BadRequestException("from and to are required");
        }
        if (from.isAfter(to)) {
            throw new BadRequestException("from must be before or equal to to");
        }
    }

    private RevenueDataPoint mapRevenueDataPoint(Object[] row) {
        return new RevenueDataPoint(toLocalDate(row[0]), toBigDecimal(row[1]), toLong(row[2]));
    }

    private TopProductResponse mapTopProduct(Object[] row) {
        return new TopProductResponse(toLong(row[0]), (String) row[1], (String) row[2], toLong(row[3]), toBigDecimal(row[4]));
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof Date date) {
            return date.toLocalDate();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }

    private Long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }
}
