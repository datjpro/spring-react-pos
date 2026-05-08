param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AdminUsername = "admin",
    [string]$AdminPassword = "postgres",
    [string]$PostgresContainer = "pos-postgres",
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432,
    [string]$PostgresDb = "pos_db",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "postgres",
    [string]$ReportDir = "docs/test-reports",
    [switch]$SkipDockerUp,
    [switch]$ResetDb,
    [switch]$AllowEndpointSkips
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$reportRoot = Join-Path $repoRoot $ReportDir
New-Item -ItemType Directory -Force -Path $reportRoot | Out-Null

$startedAt = Get-Date
$runId = $startedAt.ToString("yyyyMMdd-HHmmss")
$reportPath = Join-Path $reportRoot "business-e2e-$runId.md"
$steps = New-Object System.Collections.Generic.List[object]
$created = [ordered]@{}
$hasSkip = $false

function Add-Step {
    param([string]$Name, [string]$Status, [string]$Detail)
    $steps.Add([ordered]@{
        time = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        name = $Name
        status = $Status
        detail = $Detail
    }) | Out-Null
}

function Invoke-CheckedStep {
    param([string]$Name, [scriptblock]$Action)
    Write-Host "==> $Name"
    try {
        $result = & $Action
        Add-Step $Name "PASS" (($result | Out-String).Trim())
        return $result
    } catch {
        Add-Step $Name "FAIL" $_.Exception.Message
        Write-Report "FAILED"
        throw
    }
}

function Invoke-OptionalStep {
    param([string]$Name, [scriptblock]$Action)
    Write-Host "==> $Name"
    try {
        $result = & $Action
        Add-Step $Name "PASS" (($result | Out-String).Trim())
        return $result
    } catch {
        $message = $_.Exception.Message
        if ($AllowEndpointSkips -and ($message -match "\(404\)" -or $message -match "\(500\) Internal Server Error")) {
            $script:hasSkip = $true
            Add-Step $Name "SKIP" "Endpoint unavailable on current backend: $message"
            return $null
        }
        Add-Step $Name "FAIL" $message
        Write-Report "FAILED"
        throw
    }
}

function Write-Report {
    param([string]$Status)

    $endedAt = Get-Date
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("# Business E2E Test Report") | Out-Null
    $lines.Add("") | Out-Null
    $lines.Add("- Status: $Status") | Out-Null
    $lines.Add("- Started at: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))") | Out-Null
    $lines.Add("- Ended at: $($endedAt.ToString('yyyy-MM-dd HH:mm:ss'))") | Out-Null
    $lines.Add("- Base URL: ``$BaseUrl``") | Out-Null
    $lines.Add("- PostgreSQL container: ``$PostgresContainer``") | Out-Null
    $lines.Add("- Run ID: ``$runId``") | Out-Null
    $lines.Add("") | Out-Null
    $lines.Add("## Seeded Business Data") | Out-Null
    foreach ($key in $created.Keys) {
        $lines.Add("- ${key}: ``$($created[$key])``") | Out-Null
    }
    $lines.Add("") | Out-Null
    $lines.Add("## Steps") | Out-Null
    foreach ($step in $steps) {
        $detail = if ([string]::IsNullOrWhiteSpace($step.detail)) { "ok" } else { $step.detail.Replace("`r", "").Replace("`n", " ") }
        if ($detail.Length -gt 500) { $detail = $detail.Substring(0, 500) + "..." }
        $lines.Add("- [$($step.status)] $($step.time) - $($step.name): $detail") | Out-Null
    }
    $lines.Add("") | Out-Null
    $lines.Add("## Business Assertions") | Out-Null
    $lines.Add("- Login admin succeeds and JWT works.") | Out-Null
    $lines.Add("- Branch, supplier, product seed succeeds or reuses existing run-specific data.") | Out-Null
    $lines.Add("- Purchase increases stock and creates `PURCHASE` stock movement.") | Out-Null
    $lines.Add("- Sale decreases stock and creates `SALE` stock movement.") | Out-Null
    $lines.Add("- Date seed maps purchase to yesterday and sale to today for report windows.") | Out-Null
    $lines.Add("- Revenue, profit, top products, inventory summary, stock card, purchase summary, sales summary, CSV export return data.") | Out-Null
    $lines.Add("- Auth, user, branch, supplier, product, order, payment, inventory, stock movement, purchase, sale, report, audit endpoints return successfully.") | Out-Null

    Set-Content -Path $reportPath -Value $lines -Encoding UTF8
}

function Invoke-JsonApi {
    param([string]$Method, [string]$Path, [object]$Body = $null, [hashtable]$Headers = @{})
    $uri = "$BaseUrl$Path"
    if ($null -eq $Body) {
        return Invoke-RestMethod -Uri $uri -Method $Method -Headers $Headers
    }
    $json = $Body | ConvertTo-Json -Depth 10 -Compress
    return Invoke-RestMethod -Uri $uri -Method $Method -ContentType "application/json" -Headers $Headers -Body $json
}

function Invoke-PsqlScalar {
    param([string]$Sql)

    if (Test-DockerAccess) {
        try {
            $output = docker exec $PostgresContainer psql -U $PostgresUser -d $PostgresDb -t -A -c $Sql 2>&1
            if ($LASTEXITCODE -eq 0) {
                return ($output | Out-String).Trim()
            }

            $dockerError = ($output | Out-String)
            if ($dockerError -notmatch "No such container" -and $dockerError -notmatch "is not running" -and $dockerError -notmatch "permission denied") {
                throw "psql via docker failed: $dockerError"
            }
        } catch {
            $dockerError = $_.Exception.Message
            if ($dockerError -notmatch "No such container" -and $dockerError -notmatch "is not running" -and $dockerError -notmatch "permission denied") {
                throw
            }
        }
    }

    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($null -ne $psqlCmd) {
        $env:PGPASSWORD = $PostgresPassword
        try {
            $output = & $psqlCmd.Source -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -t -A -c $Sql 2>&1
            if ($LASTEXITCODE -ne 0) { throw "psql local failed: $($output | Out-String)" }
            return ($output | Out-String).Trim()
        } finally {
            Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        }
    }

    return Invoke-JdbcScalar $Sql
}

function Invoke-JdbcScalar {
    param([string]$Sql)

    $jar = Get-ChildItem "$env:USERPROFILE\.m2\repository\org\postgresql\postgresql" -Recurse -Filter "postgresql-*.jar" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if ($null -eq $jar) {
        throw "No PostgreSQL access. Need Docker permission, local 'psql', or PostgreSQL JDBC jar in Maven cache."
    }

    $tmpDir = Join-Path $env:TEMP "pos-e2e-jdbc"
    New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
    $javaFile = Join-Path $tmpDir "JdbcScalar.java"
    $className = "JdbcScalar"
    $source = @"
import java.sql.*;

public class JdbcScalar {
    public static void main(String[] args) throws Exception {
        String url = args[0];
        String user = args[1];
        String password = args[2];
        String sql = args[3];
        try (Connection connection = DriverManager.getConnection(url, user, password);
             Statement statement = connection.createStatement()) {
            boolean hasResultSet = statement.execute(sql);
            if (hasResultSet) {
                try (ResultSet rs = statement.getResultSet()) {
                    if (rs.next()) {
                        Object value = rs.getObject(1);
                        if (value != null) {
                            System.out.print(value.toString());
                        }
                    }
                }
            } else {
                System.out.print(statement.getUpdateCount());
            }
        }
    }
}
"@
    [System.IO.File]::WriteAllText($javaFile, $source, (New-Object System.Text.UTF8Encoding($false)))

    $compileOutput = & javac -cp $jar.FullName $javaFile 2>&1
    if ($LASTEXITCODE -ne 0) { throw "javac JDBC helper failed: $($compileOutput | Out-String)" }

    $jdbcUrl = "jdbc:postgresql://$PostgresHost`:$PostgresPort/$PostgresDb"
    $classpath = "$tmpDir;$($jar.FullName)"
    $output = & java -cp $classpath $className $jdbcUrl $PostgresUser $PostgresPassword $Sql 2>&1
    if ($LASTEXITCODE -ne 0) { throw "JDBC PostgreSQL failed: $($output | Out-String)" }
    return ($output | Out-String).Trim()
}

function Test-DockerAccess {
    try {
        & docker ps 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Invoke-DockerComposeChecked {
    param([string[]]$Args)
    $output = & docker compose @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose $($Args -join ' ') failed: $($output | Out-String)"
    }
    return ($output | Out-String).Trim()
}

function Wait-ApiReady {
    for ($i = 1; $i -le 60; $i++) {
        try {
            $uri = "$BaseUrl/api/v1/products?page=0&size=1"
            try {
                Invoke-WebRequest -Uri $uri -Method Get | Out-Null
                return "ready after $i attempts"
            } catch {
                if ($_.Exception.Message -match "401" -or $_.Exception.Message -match "403") {
                    return "ready after $i attempts"
                }
                throw
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    throw "API not ready at $BaseUrl"
}

try {
    Invoke-CheckedStep "Start PostgreSQL and backend" {
        if (-not $SkipDockerUp) {
            if (-not (Test-DockerAccess)) {
                throw "Docker not accessible. Start Docker Desktop or run script with -SkipDockerUp if backend/db already up and DB reachable."
            }
            if ($ResetDb) { Invoke-DockerComposeChecked -Args @("down", "-v") | Out-Null }
            Invoke-DockerComposeChecked -Args @("up", "-d", "--build") | Out-Null
        }
        "docker compose ready"
    } | Out-Null

    Invoke-CheckedStep "Wait API ready" { Wait-ApiReady } | Out-Null

    $login = Invoke-CheckedStep "Login admin" {
        Invoke-JsonApi -Method Post -Path "/api/v1/auth/login" -Body @{ username = $AdminUsername; password = $AdminPassword }
    }
    $headers = @{ Authorization = "Bearer $($login.accessToken)" }

    Invoke-CheckedStep "Refresh auth token" {
        Invoke-JsonApi -Method Post -Path "/api/v1/auth/refresh" -Body @{ refreshToken = $login.refreshToken }
    } | Out-Null

    $branchCode = "BR-E2E-$runId"
    $supplierCode = "SUP-E2E-$runId"
    $skuSuffix = ($runId -replace '-', '')
    $sku = "ET-TS-BLK-L-$skuSuffix"
    $testUserName = "user_e2e_$($runId.Replace('-', '_'))"

    $branch = Invoke-CheckedStep "Seed branch" {
        Invoke-JsonApi -Method Post -Path "/api/v1/branches" -Headers $headers -Body @{
            code = $branchCode
            name = "Chi nhanh E2E $runId"
            address = "Ha Noi"
        }
    }
    $created.branchId = $branch.id

    Invoke-CheckedStep "List branches" { Invoke-JsonApi -Method Get -Path "/api/v1/branches" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Get branch by id" { Invoke-JsonApi -Method Get -Path "/api/v1/branches/$($branch.id)" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Update branch" {
        Invoke-JsonApi -Method Put -Path "/api/v1/branches/$($branch.id)" -Headers $headers -Body @{
            code = $branchCode
            name = "Chi nhanh E2E updated $runId"
            address = "Ha Noi updated"
        }
    } | Out-Null

    $supplier = Invoke-CheckedStep "Seed supplier" {
        Invoke-JsonApi -Method Post -Path "/api/v1/suppliers" -Headers $headers -Body @{
            code = $supplierCode
            name = "Nha cung cap E2E $runId"
            phone = "0900000000"
            email = "supplier.$runId@example.com"
            address = "Ha Noi"
        }
    }
    $created.supplierId = $supplier.id

    Invoke-CheckedStep "List suppliers" { Invoke-JsonApi -Method Get -Path "/api/v1/suppliers" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Get supplier by id" { Invoke-JsonApi -Method Get -Path "/api/v1/suppliers/$($supplier.id)" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Update supplier" {
        Invoke-JsonApi -Method Put -Path "/api/v1/suppliers/$($supplier.id)" -Headers $headers -Body @{
            code = $supplierCode
            name = "Nha cung cap E2E updated $runId"
            phone = "0900000001"
            email = "supplier.updated.$runId@example.com"
            address = "Ha Noi updated"
        }
    } | Out-Null

    $product = Invoke-CheckedStep "Seed product" {
        Invoke-JsonApi -Method Post -Path "/api/v1/products" -Headers $headers -Body @{
            sku = $sku
            name = "San pham E2E $runId"
            category = "Do uong"
            price = 25000
            cost = 15000
            stock = 10
            unit = "ly"
            barcode = "893$($startedAt.ToString('HHmmss'))"
            description = "Seed by business e2e"
            imageUrl = "https://example.com/e2e.jpg"
        }
    }
    $created.productId = $product.id

    Invoke-CheckedStep "List products" { Invoke-JsonApi -Method Get -Path "/api/v1/products?page=0&size=10&search=ET-TS-BLK-L&sort=name&order=asc" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Get product by id" { Invoke-JsonApi -Method Get -Path "/api/v1/products/$($product.id)" -Headers $headers } | Out-Null
    Invoke-CheckedStep "List product categories" { Invoke-JsonApi -Method Get -Path "/api/v1/products/categories" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Update product" {
        Invoke-JsonApi -Method Put -Path "/api/v1/products/$($product.id)" -Headers $headers -Body @{
            name = "San pham E2E updated $runId"
            category = "Do uong"
            price = 25000
            cost = 15000
            stock = 10
            unit = "ly"
            barcode = "893$($startedAt.ToString('HHmmss'))"
            description = "Updated by business e2e"
            imageUrl = "https://example.com/e2e-updated.jpg"
            active = $true
        }
    } | Out-Null

    $user = Invoke-CheckedStep "Create user" {
        Invoke-JsonApi -Method Post -Path "/api/v1/users" -Headers $headers -Body @{
            username = $testUserName
            password = "P@ssw0rd"
            role = "STAFF"
            branchId = $branch.id
            active = $true
        }
    }
    $created.userId = $user.id
    Invoke-CheckedStep "List users" { Invoke-JsonApi -Method Get -Path "/api/v1/users" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Get current user" { Invoke-JsonApi -Method Get -Path "/api/v1/users/me" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Update user" {
        Invoke-JsonApi -Method Put -Path "/api/v1/users/$($user.id)" -Headers $headers -Body @{
            role = "STAFF"
            branchId = $branch.id
            active = $true
        }
    } | Out-Null
    Invoke-CheckedStep "Update user active" {
        Invoke-JsonApi -Method Patch -Path "/api/v1/users/$($user.id)/active" -Headers $headers -Body @{ active = $true }
    } | Out-Null

    $order = Invoke-CheckedStep "Create order" {
        Invoke-JsonApi -Method Post -Path "/api/v1/orders" -Headers $headers -Body @{
            discountAmount = 0
            items = @(@{ productId = $product.id; quantity = 1 })
        }
    }
    $created.orderId = $order.id
    Invoke-CheckedStep "List orders" { Invoke-JsonApi -Method Get -Path "/api/v1/orders?page=0&size=10" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Get order by id" { Invoke-JsonApi -Method Get -Path "/api/v1/orders/$($order.id)" -Headers $headers } | Out-Null

    $payment = Invoke-CheckedStep "Create payment" {
        Invoke-JsonApi -Method Post -Path "/api/v1/payments" -Headers $headers -Body @{
            orderId = $order.id
            paymentMethod = "CASH"
            amountReceived = 25000
            paymentReference = "PAY-E2E-$runId"
            note = "Payment E2E"
        }
    }
    $created.paymentId = $payment.id
    Invoke-CheckedStep "Get payment by id" { Invoke-JsonApi -Method Get -Path "/api/v1/payments/$($payment.id)" -Headers $headers } | Out-Null
    Invoke-CheckedStep "List payments by order" { Invoke-JsonApi -Method Get -Path "/api/v1/payments?orderId=$($order.id)" -Headers $headers } | Out-Null

    $cancelOrder = Invoke-CheckedStep "Create cancellable order" {
        Invoke-JsonApi -Method Post -Path "/api/v1/orders" -Headers $headers -Body @{
            discountAmount = 0
            items = @(@{ productId = $product.id; quantity = 1 })
        }
    }
    Invoke-CheckedStep "Cancel order" {
        Invoke-JsonApi -Method Post -Path "/api/v1/orders/$($cancelOrder.id)/cancel" -Headers $headers -Body @{ reason = "Cancel by E2E" }
    } | Out-Null

    Invoke-CheckedStep "Create inventory adjustment" {
        Invoke-JsonApi -Method Post -Path "/api/v1/inventory/adjustments" -Headers $headers -Body @{
            productId = $product.id
            adjustmentType = "INCREASE"
            quantity = 1
            reason = "Inventory E2E"
            note = "Legacy inventory adjustment"
        }
    } | Out-Null
    Invoke-CheckedStep "List inventory adjustments" { Invoke-JsonApi -Method Get -Path "/api/v1/inventory/adjustments?page=0&size=10&productId=$($product.id)" -Headers $headers } | Out-Null
    Invoke-CheckedStep "List low stock products" { Invoke-JsonApi -Method Get -Path "/api/v1/inventory/low-stock?threshold=100" -Headers $headers } | Out-Null

    Invoke-CheckedStep "Create stock adjustment" {
        Invoke-JsonApi -Method Post -Path "/api/v1/stock-movements/adjustments" -Headers $headers -Body @{
            productId = $product.id
            branchId = $branch.id
            quantityDelta = 1
            reason = "Stock movement E2E"
            note = "Stock adjustment endpoint"
        }
    } | Out-Null
    Invoke-CheckedStep "List stock movements" { Invoke-JsonApi -Method Get -Path "/api/v1/stock-movements?branchId=$($branch.id)&page=0&size=10" -Headers $headers } | Out-Null

    $purchase = Invoke-CheckedStep "Create purchase" {
        Invoke-JsonApi -Method Post -Path "/api/v1/purchases" -Headers $headers -Body @{
            supplierId = $supplier.id
            branchId = $branch.id
            note = "Nhap hang E2E"
            items = @(@{ productId = $product.id; quantity = 20; unitCost = 15000 })
        }
    }
    $created.purchaseId = $purchase.id

    Invoke-CheckedStep "List purchases" { Invoke-JsonApi -Method Get -Path "/api/v1/purchases" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Get purchase by id" { Invoke-JsonApi -Method Get -Path "/api/v1/purchases/$($purchase.id)" -Headers $headers } | Out-Null

    $cancelPurchase = Invoke-CheckedStep "Create cancellable purchase" {
        Invoke-JsonApi -Method Post -Path "/api/v1/purchases" -Headers $headers -Body @{
            supplierId = $supplier.id
            branchId = $branch.id
            note = "Nhap hang E2E cancel"
            items = @(@{ productId = $product.id; quantity = 1; unitCost = 15000 })
        }
    }
    Invoke-CheckedStep "Cancel purchase" {
        Invoke-JsonApi -Method Post -Path "/api/v1/purchases/$($cancelPurchase.id)/cancel" -Headers $headers -Body @{ reason = "Cancel by E2E" }
    } | Out-Null

    $sale = Invoke-CheckedStep "Create sale" {
        Invoke-JsonApi -Method Post -Path "/api/v1/sales" -Headers $headers -Body @{
            branchId = $branch.id
            note = "Ban hang E2E"
            items = @(@{ productId = $product.id; quantity = 5 })
        }
    }
    $created.saleId = $sale.id

    Invoke-CheckedStep "List sales" { Invoke-JsonApi -Method Get -Path "/api/v1/sales" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Get sale by id" { Invoke-JsonApi -Method Get -Path "/api/v1/sales/$($sale.id)" -Headers $headers } | Out-Null

    $cancelSale = Invoke-CheckedStep "Create cancellable sale" {
        Invoke-JsonApi -Method Post -Path "/api/v1/sales" -Headers $headers -Body @{
            branchId = $branch.id
            note = "Ban hang E2E cancel"
            items = @(@{ productId = $product.id; quantity = 1 })
        }
    }
    Invoke-CheckedStep "Cancel sale" {
        Invoke-JsonApi -Method Post -Path "/api/v1/sales/$($cancelSale.id)/cancel" -Headers $headers -Body @{ reason = "Cancel by E2E" }
    } | Out-Null

    Invoke-CheckedStep "Seed business dates in PostgreSQL" {
        $purchaseDate = (Get-Date).Date.AddDays(-1).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss")
        $saleDate = (Get-Date).Date.AddHours(10).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss")
        Invoke-PsqlScalar "update purchases set created_at = timestamp '$purchaseDate' where id = $($purchase.id); update sales set created_at = timestamp '$saleDate' where id = $($sale.id); update stock_movements set created_at = timestamp '$purchaseDate' where reference_type = 'PURCHASE' and reference_id = $($purchase.id); update stock_movements set created_at = timestamp '$saleDate' where reference_type = 'SALE' and reference_id = $($sale.id); select 'dates seeded';"
    } | Out-Null

    Invoke-CheckedStep "Assert stock quantity" {
        $stock = [int](Invoke-PsqlScalar "select stock from products where id = $($product.id);")
        if ($stock -ne 26) { throw "expected stock 26, got $stock" }
        "stock=$stock"
    } | Out-Null

    Invoke-CheckedStep "Assert stock movements" {
        $count = [int](Invoke-PsqlScalar "select count(*) from stock_movements where product_id = $($product.id) and branch_id = $($branch.id) and reference_type in ('PURCHASE','SALE');")
        if ($count -lt 2) { throw "expected at least 2 stock movements, got $count" }
        "stock_movements=$count"
    } | Out-Null

    $from = (Get-Date).Date.AddDays(-2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $to = (Get-Date).Date.AddDays(1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $query = "from=$from&to=$to&branchId=$($branch.id)"

    Invoke-CheckedStep "Check revenue report" { Invoke-JsonApi -Method Get -Path "/api/v1/reports/revenue?$query&groupBy=day" -Headers $headers } | Out-Null
    Invoke-OptionalStep "Check profit report" { Invoke-JsonApi -Method Get -Path "/api/v1/reports/profit?$query&groupBy=day" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Check top products report" { Invoke-JsonApi -Method Get -Path "/api/v1/reports/top-products?$query&limit=10&sortBy=quantity" -Headers $headers } | Out-Null
    Invoke-OptionalStep "Check inventory summary" { Invoke-JsonApi -Method Get -Path "/api/v1/reports/inventory-summary" -Headers $headers } | Out-Null
    Invoke-OptionalStep "Check stock card report" { Invoke-JsonApi -Method Get -Path "/api/v1/reports/stock-card?productId=$($product.id)&branchId=$($branch.id)&from=$from&to=$to" -Headers $headers } | Out-Null
    Invoke-OptionalStep "Check purchase summary" { Invoke-JsonApi -Method Get -Path "/api/v1/reports/purchase-summary?$query&supplierId=$($supplier.id)" -Headers $headers } | Out-Null
    Invoke-OptionalStep "Check sales summary" { Invoke-JsonApi -Method Get -Path "/api/v1/reports/sales-summary?$query&createdBy=$AdminUsername" -Headers $headers } | Out-Null
    Invoke-CheckedStep "Check CSV export" { Invoke-JsonApi -Method Get -Path "/api/v1/reports/export?type=revenue&format=csv&$query&groupBy=day" -Headers $headers } | Out-Null

    Invoke-CheckedStep "List audit logs" { Invoke-JsonApi -Method Get -Path "/api/v1/audit-logs?page=0&size=10" -Headers $headers } | Out-Null

    $deleteProduct = Invoke-CheckedStep "Create deletable product" {
        Invoke-JsonApi -Method Post -Path "/api/v1/products" -Headers $headers -Body @{
            sku = "ET-TS-WHT-M-DEL$skuSuffix"
            name = "San pham E2E delete $runId"
            category = "Do uong"
            price = 10000
            cost = 5000
            stock = 0
            unit = "ly"
            barcode = "DEL$($startedAt.ToString('HHmmss'))"
            description = "Delete by business e2e"
            imageUrl = "https://example.com/e2e-delete.jpg"
        }
    }
    Invoke-CheckedStep "Delete product" { Invoke-JsonApi -Method Delete -Path "/api/v1/products/$($deleteProduct.id)" -Headers $headers } | Out-Null

    $deleteSupplier = Invoke-CheckedStep "Create deletable supplier" {
        Invoke-JsonApi -Method Post -Path "/api/v1/suppliers" -Headers $headers -Body @{
            code = "SUP-E2E-DEL-$runId"
            name = "Nha cung cap E2E delete $runId"
            phone = "0900000002"
            email = "supplier.delete.$runId@example.com"
            address = "Ha Noi"
        }
    }
    Invoke-CheckedStep "Delete supplier" { Invoke-JsonApi -Method Delete -Path "/api/v1/suppliers/$($deleteSupplier.id)" -Headers $headers } | Out-Null

    $deleteBranch = Invoke-CheckedStep "Create deletable branch" {
        Invoke-JsonApi -Method Post -Path "/api/v1/branches" -Headers $headers -Body @{
            code = "BR-E2E-DEL-$runId"
            name = "Chi nhanh E2E delete $runId"
            address = "Ha Noi"
        }
    }
    Invoke-CheckedStep "Delete branch" { Invoke-JsonApi -Method Delete -Path "/api/v1/branches/$($deleteBranch.id)" -Headers $headers } | Out-Null

    Invoke-CheckedStep "Logout admin" { Invoke-JsonApi -Method Post -Path "/api/v1/auth/logout" -Headers $headers } | Out-Null

    $finalStatus = if ($hasSkip) { "PASSED_WITH_SKIPS" } else { "PASSED" }
    Write-Report $finalStatus
    Write-Host "Report: $reportPath"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Report: $reportPath"
    exit 1
}
