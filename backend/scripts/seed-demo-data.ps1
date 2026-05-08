param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AdminUsername = "admin",
    [string]$AdminPassword = "postgres",
    [int]$BranchCount = 3,
    [int]$SupplierCount = 8,
    [int]$ProductCount = 40,
    [int]$PurchaseCount = 20,
    [int]$SaleCount = 35,
    [int]$UserCount = 6,
    [string]$Prefix = "DEMO",
    [switch]$SkipDateBackfill
)

$ErrorActionPreference = "Stop"

$startedAt = Get-Date
$seedId = "$Prefix-$($startedAt.ToString('yyyyMMdd-HHmmss'))"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

function Invoke-JsonApi {
    param([string]$Method, [string]$Path, [object]$Body = $null, [hashtable]$Headers = @{})
    $uri = "$BaseUrl$Path"
    if ($null -eq $Body) {
        return Invoke-RestMethod -Uri $uri -Method $Method -Headers $Headers
    }
    $json = $Body | ConvertTo-Json -Depth 10 -Compress
    return Invoke-RestMethod -Uri $uri -Method $Method -ContentType "application/json" -Headers $Headers -Body $json
}

function Test-DockerAccess {
    try {
        & docker ps 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Invoke-SqlNonQuery {
    param([string]$Sql)

    if (Test-DockerAccess) {
        try {
            $output = docker exec pos-postgres psql -U postgres -d pos_db -t -A -c $Sql 2>&1
            if ($LASTEXITCODE -eq 0) { return ($output | Out-String).Trim() }
        } catch {}
    }

    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($null -ne $psqlCmd) {
        $env:PGPASSWORD = "postgres"
        try {
            $output = & $psqlCmd.Source -h localhost -p 5432 -U postgres -d pos_db -t -A -c $Sql 2>&1
            if ($LASTEXITCODE -eq 0) { return ($output | Out-String).Trim() }
        } finally {
            Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        }
    }

    $jar = Get-ChildItem "$env:USERPROFILE\.m2\repository\org\postgresql\postgresql" -Recurse -Filter "postgresql-*.jar" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if ($null -eq $jar) {
        throw "No PostgreSQL access for date backfill. Use Docker, local psql, or Maven JDBC jar."
    }

    $tmpDir = Join-Path $env:TEMP "pos-demo-seed-jdbc"
    New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
    $javaFile = Join-Path $tmpDir "JdbcExec.java"
    $source = @"
import java.sql.*;
public class JdbcExec {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection(args[0], args[1], args[2]);
         Statement s = c.createStatement()) {
      s.execute(args[3]);
    }
  }
}
"@
    [System.IO.File]::WriteAllText($javaFile, $source, (New-Object System.Text.UTF8Encoding($false)))
    & javac -cp $jar.FullName $javaFile | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "javac JDBC helper failed" }
    $jdbcUrl = "jdbc:postgresql://localhost:5432/pos_db"
    $output = & java -cp "$tmpDir;$($jar.FullName)" JdbcExec $jdbcUrl postgres postgres $Sql 2>&1
    if ($LASTEXITCODE -ne 0) { throw "JDBC PostgreSQL failed: $($output | Out-String)" }
}

Write-Host "Seed ID: $seedId"

$login = Invoke-JsonApi -Method Post -Path "/api/v1/auth/login" -Body @{ username = $AdminUsername; password = $AdminPassword }
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

$branches = @()
for ($i = 1; $i -le $BranchCount; $i++) {
    $branch = Invoke-JsonApi -Method Post -Path "/api/v1/branches" -Headers $headers -Body @{
        code = "BR-$seedId-$i"
        name = "Chi nhanh $seedId $i"
        address = "Dia chi $i"
    }
    $branches += $branch
}

$suppliers = @()
for ($i = 1; $i -le $SupplierCount; $i++) {
    $supplier = Invoke-JsonApi -Method Post -Path "/api/v1/suppliers" -Headers $headers -Body @{
        code = "SUP-$seedId-$i"
        name = "Nha cung cap $seedId $i"
        phone = "09{0:d8}" -f $i
        email = "supplier.$seedId.$i@example.com"
        address = "Khu vuc $i"
    }
    $suppliers += $supplier
}

$products = @()
$categories = @("Ao so mi", "Ao thun", "Quan tay", "Quan jean")
$brandCodes = @("OW", "UN", "AR", "VI")
$typeCodes = @("SM", "TS", "TR", "JN")
$colorCodes = @("BLU", "BLK", "WHT", "GRY", "BRN")
$sizeCodes = @("S", "M", "L", "XL", "XXL")

function Build-DemoSku {
    param(
        [int]$Index,
        [string]$SeedId,
        [string[]]$Brands,
        [string[]]$Types,
        [string[]]$Colors,
        [string[]]$Sizes
    )

    $brand = $Brands[($Index - 1) % $Brands.Count]
    $type = $Types[($Index - 1) % $Types.Count]
    $color = $Colors[($Index - 1) % $Colors.Count]
    $size = $Sizes[($Index - 1) % $Sizes.Count]
    $batchCode = $SeedId.Substring($SeedId.Length - 4)
    $serial = '{0:d3}' -f $Index
    return "$brand-$type-$color-$size-$batchCode$serial"
}

for ($i = 1; $i -le $ProductCount; $i++) {
    $price = 12000 + ($i * 1500)
    $cost = [Math]::Max(5000, $price - 4000)
    $sku = Build-DemoSku -Index $i -SeedId $seedId -Brands $brandCodes -Types $typeCodes -Colors $colorCodes -Sizes $sizeCodes
    $product = Invoke-JsonApi -Method Post -Path "/api/v1/products" -Headers $headers -Body @{
        sku = $sku
        name = "San pham $seedId $i"
        category = $categories[($i - 1) % $categories.Count]
        price = $price
        cost = $cost
        stock = 80 + ($i % 25)
        unit = "mon"
        barcode = "DEM$($startedAt.ToString('HHmmss'))$('{0:d3}' -f $i)"
        description = "Demo seed $seedId"
        imageUrl = "https://example.com/demo-seed.jpg"
    }
    $products += $product
}

$users = @()
$roles = @("STAFF", "MANAGER")
for ($i = 1; $i -le $UserCount; $i++) {
    $user = Invoke-JsonApi -Method Post -Path "/api/v1/users" -Headers $headers -Body @{
        username = "demo_$($seedId.Replace('-', '_'))_$i"
        password = "P@ssw0rd"
        role = $roles[($i - 1) % $roles.Count]
        branchId = $branches[($i - 1) % $branches.Count].id
        active = $true
    }
    $users += $user
}

$purchaseIds = @()
for ($i = 1; $i -le $PurchaseCount; $i++) {
    $productA = $products[($i - 1) % $products.Count]
    $productB = $products[$i % $products.Count]
    $purchase = Invoke-JsonApi -Method Post -Path "/api/v1/purchases" -Headers $headers -Body @{
        supplierId = $suppliers[($i - 1) % $suppliers.Count].id
        branchId = $branches[($i - 1) % $branches.Count].id
        note = "Nhap demo $seedId $i"
        items = @(
            @{ productId = $productA.id; quantity = 10 + ($i % 5); unitCost = $productA.cost },
            @{ productId = $productB.id; quantity = 6 + ($i % 4); unitCost = $productB.cost }
        )
    }
    $purchaseIds += $purchase.id
}

$saleIds = @()
for ($i = 1; $i -le $SaleCount; $i++) {
    $productA = $products[($i * 2 - 2) % $products.Count]
    $productB = $products[($i * 2 - 1) % $products.Count]
    $sale = Invoke-JsonApi -Method Post -Path "/api/v1/sales" -Headers $headers -Body @{
        branchId = $branches[($i - 1) % $branches.Count].id
        note = "Ban demo $seedId $i"
        items = @(
            @{ productId = $productA.id; quantity = 1 + ($i % 3) },
            @{ productId = $productB.id; quantity = 1 + (($i + 1) % 2) }
        )
    }
    $saleIds += $sale.id
}

if (-not $SkipDateBackfill) {
    $sqlParts = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt $purchaseIds.Count; $i++) {
        $daysBack = 30 - ($i % 30)
        $dateValue = (Get-Date).Date.AddDays(-$daysBack).AddHours(8 + ($i % 8)).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss")
        $purchaseId = $purchaseIds[$i]
        $sqlParts.Add("update purchases set created_at = timestamp '$dateValue' where id = $purchaseId;") | Out-Null
        $sqlParts.Add("update stock_movements set created_at = timestamp '$dateValue' where reference_type = 'PURCHASE' and reference_id = $purchaseId;") | Out-Null
    }
    for ($i = 0; $i -lt $saleIds.Count; $i++) {
        $daysBack = 30 - ($i % 30)
        $dateValue = (Get-Date).Date.AddDays(-$daysBack).AddHours(10 + ($i % 10)).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss")
        $saleId = $saleIds[$i]
        $sqlParts.Add("update sales set created_at = timestamp '$dateValue' where id = $saleId;") | Out-Null
        $sqlParts.Add("update stock_movements set created_at = timestamp '$dateValue' where reference_type = 'SALE' and reference_id = $saleId;") | Out-Null
    }
    Invoke-SqlNonQuery ($sqlParts -join ' ')
}

$summary = [ordered]@{
    seedId = $seedId
    branches = $branches.Count
    suppliers = $suppliers.Count
    products = $products.Count
    users = $users.Count
    purchases = $purchaseIds.Count
    sales = $saleIds.Count
}

$summaryPath = Join-Path $repoRoot "docs/test-reports/demo-seed-$($startedAt.ToString('yyyyMMdd-HHmmss')).json"
$summary | ConvertTo-Json -Depth 5 | Set-Content -Path $summaryPath -Encoding utf8

Write-Host "Seed complete."
Write-Host "Summary file: $summaryPath"
$summary.GetEnumerator() | ForEach-Object { Write-Host ("{0}: {1}" -f $_.Key, $_.Value) }
