$baseUrl = "http://localhost:8081"

$loginBody = @{
    username = "admin"
    password = "123456"
} | ConvertTo-Json -Compress

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResponse.accessToken
$headers = @{ Authorization = "Bearer $token" }

$sku = "SP-P2-001"
$productBody = @{
    sku = $sku
    name = "San pham phase 2"
    category = "Do uong"
    price = 25000
    cost = 18000
    stock = 30
    unit = "ly"
    barcode = "893600000201"
    description = "Du lieu test phase 2"
    imageUrl = "https://example.com/p2.jpg"
} | ConvertTo-Json -Compress

try {
    $productResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/products" -Method Post -ContentType "application/json" -Headers $headers -Body $productBody
} catch {
    $products = Invoke-RestMethod -Uri "$baseUrl/api/v1/products?page=0&size=50" -Method Get -Headers $headers
    $productResponse = $products.content | Where-Object { $_.sku -eq $sku } | Select-Object -First 1
}

$orderBody = @{
    discountAmount = 0
    note = "order test phase 2"
    items = @(
        @{
            productId = $productResponse.id
            quantity = 2
        }
    )
} | ConvertTo-Json -Compress -Depth 5

$orderResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/orders" -Method Post -ContentType "application/json" -Headers $headers -Body $orderBody

$paymentBody = @{
    orderId = $orderResponse.id
    paymentMethod = "CASH"
    amountReceived = 60000
    note = "thu tien mat"
} | ConvertTo-Json -Compress

$paymentResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/payments" -Method Post -ContentType "application/json" -Headers $headers -Body $paymentBody

$from = (Get-Date).AddDays(-7).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$to = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$revenueResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reports/revenue?from=$from&to=$to&groupBy=day" -Method Get -Headers $headers
$topProductsResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reports/top-products?from=$from&to=$to&limit=10&sortBy=quantity" -Method Get -Headers $headers
$inventorySummaryResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reports/inventory-summary" -Method Get -Headers $headers

Write-Host "LOGIN"
$loginResponse | ConvertTo-Json -Depth 5
Write-Host "ORDER"
$orderResponse | ConvertTo-Json -Depth 10
Write-Host "PAYMENT"
$paymentResponse | ConvertTo-Json -Depth 10
Write-Host "REVENUE"
$revenueResponse | ConvertTo-Json -Depth 10
Write-Host "TOP_PRODUCTS"
$topProductsResponse | ConvertTo-Json -Depth 10
Write-Host "INVENTORY_SUMMARY"
$inventorySummaryResponse | ConvertTo-Json -Depth 10
