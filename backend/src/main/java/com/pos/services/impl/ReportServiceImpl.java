package com.pos.services.impl;

import com.pos.common.enums.PurchaseStatus;
import com.pos.common.exception.BadRequestException;
import com.pos.dtos.response.*;
import com.pos.entities.StockMovementEntity;
import com.pos.repositories.BranchProductStockRepository;
import com.pos.repositories.ProductRepository;
import com.pos.repositories.PurchaseRepository;
import com.pos.repositories.SaleItemRepository;
import com.pos.repositories.StockMovementRepository;
import com.pos.services.ReportService;
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
    private final BranchProductStockRepository branchProductStockRepository;
    private final PurchaseRepository purchaseRepository;
    private final StockMovementRepository stockMovementRepository;

    public ReportServiceImpl(SaleItemRepository saleItemRepository,
                             ProductRepository productRepository,
                             BranchProductStockRepository branchProductStockRepository,
                             PurchaseRepository purchaseRepository,
                             StockMovementRepository stockMovementRepository) {
        this.saleItemRepository = saleItemRepository;
        this.productRepository = productRepository;
        this.branchProductStockRepository = branchProductStockRepository;
        this.purchaseRepository = purchaseRepository;
        this.stockMovementRepository = stockMovementRepository;
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
        Object[] totals = firstRow(branchProductStockRepository.summarizeInventoryByBranchStock(DEFAULT_LOW_STOCK_THRESHOLD));
        return new InventorySummaryResponse(
                productRepository.count(),
                productRepository.countByActiveTrue(),
                toLong(totals[1]),
                toLong(totals[2]),
                toLong(totals[3]));
    }

    @Override
    public ProfitReportResponse getProfitReport(Instant from, Instant to, String groupBy, Long branchId) {
        validateDateRange(from, to);
        String normalizedGroupBy = normalizeGroupBy(groupBy);

        List<ProfitDataPoint> daily = saleItemRepository.summarizeProfitByDate(COMPLETED, from, to, branchId)
                .stream()
                .map(row -> new ProfitDataPoint(
                        toLocalDate(row[0]),
                        toBigDecimal(row[1]),
                        toBigDecimal(row[2]),
                        toBigDecimal(row[1]).subtract(toBigDecimal(row[2]))
                )).toList();

        List<ProfitDataPoint> grouped = groupProfitDataPoints(daily, normalizedGroupBy);
        BigDecimal totalRevenue = grouped.stream().map(ProfitDataPoint::revenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = grouped.stream().map(ProfitDataPoint::cost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalProfit = totalRevenue.subtract(totalCost);

        return new ProfitReportResponse(from, to, normalizedGroupBy, totalRevenue, totalCost, totalProfit, grouped);
    }

    @Override
    public StockCardReportResponse getStockCard(Long productId, Long branchId, Instant from, Instant to) {
        if (productId == null || branchId == null) {
            throw new BadRequestException("productId and branchId are required");
        }
        validateDateRange(from, to);

        List<StockCardEntryResponse> entries = stockMovementRepository.findStockCard(productId, branchId, from, to)
                .stream()
                .map(this::mapStockCard)
                .toList();

        return new StockCardReportResponse(productId, branchId, from, to, entries);
    }

    @Override
    public PurchaseSummaryResponse getPurchaseSummary(Instant from, Instant to, Long supplierId, Long branchId) {
        validateDateRange(from, to);
        Object[] row = firstRow(purchaseRepository.summarizePurchases(from, to, supplierId, branchId));
        return new PurchaseSummaryResponse(from, to, supplierId, branchId, toLong(row[0]), toLong(row[1]), toBigDecimal(row[2]));
    }

    @Override
    public SalesSummaryResponse getSalesSummary(Instant from, Instant to, Long branchId, String createdBy) {
        validateDateRange(from, to);
        Object[] row = firstRow(saleItemRepository.summarizeSales(COMPLETED, from, to, branchId, createdBy));
        return new SalesSummaryResponse(from, to, branchId, createdBy, toLong(row[0]), toLong(row[1]), toBigDecimal(row[2]));
    }

    @Override
    public String exportReportCsv(String type, Instant from, Instant to, String groupBy, int limit, String sortBy,
                                  Long branchId, Long productId, Long supplierId, String createdBy) {
        String normalizedType = normalizeType(type);
        return switch (normalizedType) {
            case "revenue" -> exportRevenueCsv(getRevenueReport(from, to, groupBy, branchId));
            case "top-products" -> exportTopProductsCsv(getTopProducts(from, to, limit, sortBy, branchId));
            case "inventory-summary" -> exportInventorySummaryCsv(getInventorySummary());
            case "profit" -> exportProfitCsv(getProfitReport(from, to, groupBy, branchId));
            case "stock-card" -> exportStockCardCsv(getStockCard(requiredLong(productId, "productId"), requiredLong(branchId, "branchId"), from, to));
            case "purchase-summary" -> exportPurchaseSummaryCsv(getPurchaseSummary(from, to, supplierId, branchId));
            case "sales-summary" -> exportSalesSummaryCsv(getSalesSummary(from, to, branchId, createdBy));
            default -> throw new BadRequestException("Unsupported report type");
        };
    }

    private void validateDateRange(Instant from, Instant to) {
        if (from == null || to == null) {
            throw new BadRequestException("from and to are required");
        }
        if (from.isAfter(to)) {
            throw new BadRequestException("from must be before to");
        }
        long days = Duration.between(from, to).toDays();
        if (days > MAX_REPORT_RANGE_DAYS) {
            throw new BadRequestException("date range must not exceed 365 days");
        }
    }

    private String normalizeGroupBy(String groupBy) {
        if (groupBy == null || groupBy.isBlank()) return "day";
        String normalized = groupBy.trim().toLowerCase();
        if (!List.of("day", "week", "month").contains(normalized)) {
            throw new BadRequestException("groupBy must be day, week, or month");
        }
        return normalized;
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) throw new BadRequestException("type is required");
        return type.trim().toLowerCase();
    }

    private List<RevenueDataPoint> groupRevenueDataPoints(List<RevenueDataPoint> dailyDataPoints, String groupBy) {
        if ("day".equals(groupBy)) return dailyDataPoints;
        Map<LocalDate, List<RevenueDataPoint>> grouped = dailyDataPoints.stream()
                .collect(Collectors.groupingBy(dataPoint -> resolvePeriodStart(dataPoint.date(), groupBy), TreeMap::new, Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> new RevenueDataPoint(
                        entry.getKey(),
                        entry.getValue().stream().map(RevenueDataPoint::revenue).reduce(BigDecimal.ZERO, BigDecimal::add),
                        entry.getValue().stream().map(RevenueDataPoint::orderCount).reduce(0L, Long::sum)))
                .toList();
    }

    private List<ProfitDataPoint> groupProfitDataPoints(List<ProfitDataPoint> dailyDataPoints, String groupBy) {
        if ("day".equals(groupBy)) return dailyDataPoints;
        Map<LocalDate, List<ProfitDataPoint>> grouped = dailyDataPoints.stream()
                .collect(Collectors.groupingBy(dataPoint -> resolvePeriodStart(dataPoint.period(), groupBy), TreeMap::new, Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    BigDecimal revenue = entry.getValue().stream().map(ProfitDataPoint::revenue).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal cost = entry.getValue().stream().map(ProfitDataPoint::cost).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new ProfitDataPoint(entry.getKey(), revenue, cost, revenue.subtract(cost));
                })
                .toList();
    }

    private LocalDate resolvePeriodStart(LocalDate date, String groupBy) {
        if ("week".equals(groupBy)) return date.with(java.time.DayOfWeek.MONDAY);
        if ("month".equals(groupBy)) return date.with(TemporalAdjusters.firstDayOfMonth());
        return date;
    }

    private String exportRevenueCsv(RevenueReportResponse response) {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("groupBy,totalRevenue,totalOrders\n");
        csvBuilder.append(response.groupBy()).append(',').append(response.totalRevenue()).append(',').append(response.totalOrders()).append("\n\n");
        csvBuilder.append("date,revenue,orderCount\n");
        response.data().forEach(dataPoint -> csvBuilder.append(dataPoint.date()).append(',').append(dataPoint.revenue()).append(',').append(dataPoint.orderCount()).append("\n"));
        return csvBuilder.toString();
    }

    private String exportTopProductsCsv(List<TopProductResponse> topProducts) {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("productId,sku,productName,totalQuantity,totalRevenue\n");
        topProducts.forEach(product -> csvBuilder.append(product.productId()).append(',').append(escapeCsv(product.sku())).append(',').append(escapeCsv(product.productName())).append(',').append(product.totalQuantity()).append(',').append(product.totalRevenue()).append("\n"));
        return csvBuilder.toString();
    }

    private String exportInventorySummaryCsv(InventorySummaryResponse summary) {
        return new StringBuilder().append("totalProducts,activeProducts,totalStock,lowStockProducts,outOfStockProducts\n")
                .append(summary.totalProducts()).append(',').append(summary.activeProducts()).append(',').append(summary.totalStock()).append(',').append(summary.lowStockProducts()).append(',').append(summary.outOfStockProducts()).append("\n").toString();
    }

    private String exportProfitCsv(ProfitReportResponse response) {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("groupBy,totalRevenue,totalCost,totalProfit\n");
        csvBuilder.append(response.groupBy()).append(',').append(response.totalRevenue()).append(',').append(response.totalCost()).append(',').append(response.totalProfit()).append("\n\n");
        csvBuilder.append("period,revenue,cost,profit\n");
        response.dataPoints().forEach(dataPoint -> csvBuilder.append(dataPoint.period()).append(',').append(dataPoint.revenue()).append(',').append(dataPoint.cost()).append(',').append(dataPoint.profit()).append("\n"));
        return csvBuilder.toString();
    }

    private String exportStockCardCsv(StockCardReportResponse response) {
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("productId,branchId,from,to\n");
        csvBuilder.append(response.productId()).append(',').append(response.branchId()).append(',').append(response.from()).append(',').append(response.to()).append("\n\n");
        csvBuilder.append("id,createdAt,movementType,quantity,referenceType,referenceId,note,createdBy\n");
        response.entries().forEach(entry -> csvBuilder.append(entry.id()).append(',').append(entry.createdAt()).append(',').append(entry.movementType()).append(',').append(entry.quantity()).append(',').append(escapeCsv(entry.referenceType())).append(',').append(entry.referenceId()).append(',').append(escapeCsv(entry.note())).append(',').append(escapeCsv(entry.createdBy())).append("\n"));
        return csvBuilder.toString();
    }

    private String exportPurchaseSummaryCsv(PurchaseSummaryResponse response) {
        return new StringBuilder().append("from,to,supplierId,branchId,totalPurchases,totalQuantity,totalAmount\n")
                .append(response.from()).append(',').append(response.to()).append(',').append(response.supplierId()).append(',').append(response.branchId()).append(',').append(response.totalPurchases()).append(',').append(response.totalQuantity()).append(',').append(response.totalAmount()).append("\n").toString();
    }

    private String exportSalesSummaryCsv(SalesSummaryResponse response) {
        return new StringBuilder().append("from,to,branchId,createdBy,totalSales,totalQuantity,totalAmount\n")
                .append(response.from()).append(',').append(response.to()).append(',').append(response.branchId()).append(',').append(escapeCsv(response.createdBy())).append(',').append(response.totalSales()).append(',').append(response.totalQuantity()).append(',').append(response.totalAmount()).append("\n").toString();
    }

    private StockCardEntryResponse mapStockCard(StockMovementEntity movement) {
        return new StockCardEntryResponse(movement.getId(), movement.getCreatedAt(), movement.getMovementType(), movement.getQuantity(), movement.getReferenceType(), movement.getReferenceId(), movement.getNote(), movement.getCreatedBy());
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        String escapedValue = value.replace("\"", "\"\"");
        if (escapedValue.contains(",") || escapedValue.contains("\"") || escapedValue.contains("\n")) return "\"" + escapedValue + "\"";
        return escapedValue;
    }

    private RevenueDataPoint mapRevenueDataPoint(Object[] row) {
        return new RevenueDataPoint(toLocalDate(row[0]), toBigDecimal(row[1]), toLong(row[2]));
    }

    private TopProductResponse mapTopProduct(Object[] row) {
        return new TopProductResponse(toLong(row[0]), (String) row[1], (String) row[2], toLong(row[3]), toBigDecimal(row[4]));
    }

    private Object[] firstRow(Object[] row) {
        if (row == null || row.length == 0) return new Object[0];
        if (row.length == 1 && row[0] instanceof Object[] nestedRow) return nestedRow;
        return row;
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate localDate) return localDate;
        if (value instanceof Date date) return date.toLocalDate();
        if (value instanceof java.util.Date date) return date.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
        return LocalDate.parse(value.toString());
    }

    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(value.toString());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bigDecimal) return bigDecimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return new BigDecimal(value.toString());
    }

    private Long requiredLong(Long value, String field) {
        if (value == null || value < 1) throw new BadRequestException(field + " is required");
        return value;
    }
}
