$baseUrl = "http://localhost:8081"

$loginBody = @{
    username = "admin"
    password = "123456"
} | ConvertTo-Json -Compress

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResponse.accessToken
$headers = @{ Authorization = "Bearer $token" }

$productBody = @{
    sku = "SP-API-001"
    name = "Ca phe test API"
    category = "Do uong"
    price = 150000
    cost = 100000
    stock = 25
    unit = "goi"
    barcode = "893600000001"
    description = "Du lieu tao qua API"
    imageUrl = "https://example.com/p1.jpg"
} | ConvertTo-Json -Compress

try {
    $productResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/products" -Method Post -ContentType "application/json" -Headers $headers -Body $productBody
} catch {
    $productResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/products?page=0&size=10" -Method Get -Headers $headers
    $productResponse = $productResponse.content | Where-Object { $_.sku -eq "SP-API-001" } | Select-Object -First 1
}

$inventoryBody = @{
    productId = $productResponse.id
    adjustmentType = "INCREASE"
    quantity = 5
    reason = "Restock test"
    note = "Tang kho qua API"
} | ConvertTo-Json -Compress

$inventoryResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/inventory/adjustments" -Method Post -ContentType "application/json" -Headers $headers -Body $inventoryBody
$lowStockResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/inventory/low-stock?threshold=40" -Method Get -Headers $headers

Write-Host "LOGIN"
$loginResponse | ConvertTo-Json -Depth 5
Write-Host "PRODUCT"
$productResponse | ConvertTo-Json -Depth 5
Write-Host "INVENTORY"
$inventoryResponse | ConvertTo-Json -Depth 5
Write-Host "LOW_STOCK"
$lowStockResponse | ConvertTo-Json -Depth 5

