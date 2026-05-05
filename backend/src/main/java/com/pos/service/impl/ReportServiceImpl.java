package com.pos.service.impl;

import com.pos.service.*;

import com.pos.common.exception.BadRequestException;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.ProductRepository;
import com.pos.dto.response.InventorySummaryResponse;
import com.pos.dto.response.RevenueDataPoint;
import com.pos.dto.response.RevenueReportResponse;
import com.pos.dto.response.TopProductResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import static com.pos.common.enums.SaleStatus.COMPLETED;

@Service
public class ReportServiceImpl implements ReportService {

    private static final int DEFAULT_LOW_STOCK_THRESHOLD = 10;
    private static final int MAX_TOP_PRODUCT_LIMIT = 100;
    private static final long MAX_REPORT_RANGE_DAYS = 365;

    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;

    public ReportServiceImpl(SaleItemRepository saleItemRepository,
            ProductRepository productRepository) {
        this.saleItemRepository = saleItemRepository;
        this.productRepository = productRepository;
    }

    @Override
    public RevenueReportResponse getRevenueReport(Instant from, Instant to, String groupBy, Long branchId) {
        validateDateRange(from, to);
        String normalizedGroupBy = normalizeGroupBy(groupBy);

        List<RevenueDataPoint> dailyDataPoints = saleItemRepository
                .summarizeRevenueByDate(COMPLETED, from, to, branchId)
                .stream()
                .map(this::mapRevenueDataPoint)
                .toList();

        List<RevenueDataPoint> groupedDataPoints = groupRevenueDataPoints(dailyDataPoints, normalizedGroupBy);
        BigDecimal totalRevenue = groupedDataPoints.stream()
                .map(RevenueDataPoint::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Long totalOrders = groupedDataPoints.stream()
                .map(RevenueDataPoint::orderCount)
                .reduce(0L, Long::sum);

        return new RevenueReportResponse(from, to, normalizedGroupBy, totalRevenue, totalOrders, groupedDataPoints);
    }

    @Override
    public List<TopProductResponse> getTopProducts(Instant from, Instant to, int limit, String sortBy, Long branchId) {
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

        return saleItemRepository.summarizeTopProducts(COMPLETED, from, to, branchId)
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
                productRepository.countByActiveTrueAndStock(0));
    }

    @Override
    public String exportReportCsv(String type, Instant from, Instant to, String groupBy, int limit, String sortBy,
            Long branchId) {
        String normalizedType = normalizeType(type);
        return switch (normalizedType) {
            case "revenue" -> exportRevenueCsv(getRevenueReport(from, to, groupBy, branchId));
            case "top-products" -> exportTopProductsCsv(getTopProducts(from, to, limit, sortBy, branchId));
            case "inventory-summary" -> exportInventorySummaryCsv(getInventorySummary());
            default -> throw new BadRequestException("Unsupported report type");
        };
    }

    private void validateDateRange(Instant from, Instant to) {
        if (from == null || to == null) {
            throw new BadRequestException("from and to are required");
        }
        if (from.isAfter(to)) {
            throw new BadRequestException("from must be before or equal to to");
        }
        long rangeDays = Duration.between(from, to).toDays();
        if (rangeDays > MAX_REPORT_RANGE_DAYS) {
            throw new BadRequestException("report date range must not exceed 365 days");
        }
    }

    private String normalizeGroupBy(String groupBy) {
        if (groupBy == null) {
            return "day";
        }
        String normalizedGroupBy = groupBy.trim().toLowerCase();
        if (!List.of("day", "week", "month").contains(normalizedGroupBy)) {
            throw new BadRequestException("groupBy must be day, week or month");
        }
        return normalizedGroupBy;
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            throw new BadRequestException("type is required");
        }
        String normalizedType = type.trim().toLowerCase();
        if (!List.of("revenue", "top-products", "inventory-summary").contains(normalizedType)) {
            throw new BadRequestException("type must be revenue, top-products or inventory-summary");
        }
        return normalizedType;
    }

    private List<RevenueDataPoint> groupRevenueDataPoints(List<RevenueDataPoint> dailyDataPoints, String groupBy) {
        if ("day".equals(groupBy)) {
            return dailyDataPoints;
        }

        Map<LocalDate, List<RevenueDataPoint>> grouped = dailyDataPoints.stream()
                .collect(Collectors.groupingBy(dataPoint -> resolvePeriodStart(dataPoint.date(), groupBy), TreeMap::new,
                        Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> new RevenueDataPoint(
                        entry.getKey(),
                        entry.getValue().stream().map(RevenueDataPoint::revenue).reduce(BigDecimal.ZERO,
                                BigDecimal::add),
                        entry.getValue().stream().map(RevenueDataPoint::orderCount).reduce(0L, Long::sum)))
                .toList();
    }

    private LocalDate resolvePeriodStart(LocalDate date, String groupBy) {
        if ("week".equals(groupBy)) {
            return date.with(java.time.DayOfWeek.MONDAY);
        }
        if ("month".equals(groupBy)) {
            return date.with(TemporalAdjusters.firstDayOfMonth());
        }
        return date;
    }

    private String exportRevenueCsv(RevenueReportResponse response) {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("groupBy,totalRevenue,totalOrders\n");
        csvBuilder.append(response.groupBy()).append(',')
                .append(response.totalRevenue()).append(',')
                .append(response.totalOrders()).append("\n\n");
        csvBuilder.append("date,revenue,orderCount\n");
        response.data().forEach(dataPoint -> csvBuilder.append(dataPoint.date()).append(',')
                .append(dataPoint.revenue()).append(',')
                .append(dataPoint.orderCount()).append("\n"));
        return csvBuilder.toString();
    }

    private String exportTopProductsCsv(List<TopProductResponse> topProducts) {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("productId,sku,productName,totalQuantity,totalRevenue\n");
        topProducts.forEach(product -> csvBuilder.append(product.productId()).append(',')
                .append(escapeCsv(product.sku())).append(',')
                .append(escapeCsv(product.productName())).append(',')
                .append(product.totalQuantity()).append(',')
                .append(product.totalRevenue()).append("\n"));
        return csvBuilder.toString();
    }

    private String exportInventorySummaryCsv(InventorySummaryResponse summary) {
        return new StringBuilder()
                .append("totalProducts,activeProducts,totalStock,lowStockProducts,outOfStockProducts\n")
                .append(summary.totalProducts()).append(',')
                .append(summary.activeProducts()).append(',')
                .append(summary.totalStock()).append(',')
                .append(summary.lowStockProducts()).append(',')
                .append(summary.outOfStockProducts()).append("\n")
                .toString();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String escapedValue = value.replace("\"", "\"\"");
        if (escapedValue.contains(",") || escapedValue.contains("\"") || escapedValue.contains("\n")) {
            return "\"" + escapedValue + "\"";
        }
        return escapedValue;
    }

    private RevenueDataPoint mapRevenueDataPoint(Object[] row) {
        return new RevenueDataPoint(toLocalDate(row[0]), toBigDecimal(row[1]), toLong(row[2]));
    }

    private TopProductResponse mapTopProduct(Object[] row) {
        return new TopProductResponse(toLong(row[0]), (String) row[1], (String) row[2], toLong(row[3]),
                toBigDecimal(row[4]));
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
