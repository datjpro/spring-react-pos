$baseUrl = "http://localhost:8081"

$loginBody = @{
    username = "admin"
    password = "123456"
} | ConvertTo-Json -Compress

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResponse.accessToken
$headers = @{ Authorization = "Bearer $token" }

$sku = "SP-P3-001"
$productBody = @{
    sku = $sku
    name = "San pham phase 3"
    category = "Thanh toan"
    price = 30000
    cost = 21000
    stock = 40
    unit = "ly"
    barcode = "893600000301"
    description = "Du lieu test phase 3"
    imageUrl = "https://example.com/p3.jpg"
} | ConvertTo-Json -Compress

try {
    $productResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/products" -Method Post -ContentType "application/json" -Headers $headers -Body $productBody
} catch {
    $products = Invoke-RestMethod -Uri "$baseUrl/api/v1/products?page=0&size=100" -Method Get -Headers $headers
    $productResponse = $products.content | Where-Object { $_.sku -eq $sku } | Select-Object -First 1
}

$orderBody = @{
    discountAmount = 0
    note = "order card test phase 3"
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
    paymentMethod = "CARD"
    amountReceived = $orderResponse.totalAmount
    paymentReference = "CARD-P3-$($orderResponse.id)"
    note = "thanh toan the phase 3"
} | ConvertTo-Json -Compress

$paymentResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/payments" -Method Post -ContentType "application/json" -Headers $headers -Body $paymentBody

$from = (Get-Date).AddDays(-7).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$to = (Get-Date).AddDays(1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$revenueResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/reports/revenue?from=$from&to=$to&groupBy=week" -Method Get -Headers $headers
$exportResponse = curl.exe -s -H "Authorization: Bearer $token" "$baseUrl/api/v1/reports/export?type=revenue&format=csv&from=$from&to=$to&groupBy=day"

Write-Host "ORDER"
$orderResponse | ConvertTo-Json -Depth 10
Write-Host "PAYMENT_CARD"
$paymentResponse | ConvertTo-Json -Depth 10
Write-Host "REVENUE_WEEK"
$revenueResponse | ConvertTo-Json -Depth 10
Write-Host "EXPORT_CSV"
$exportResponse
