param(
    [string]$PostgresContainer = "pos-postgres",
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432,
    [string]$PostgresDb = "pos_db",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "postgres"
)

$ErrorActionPreference = "Stop"

function Invoke-SqlScalar {
    param([string]$Sql)

    if (Test-DockerAccess) {
        $output = docker exec $PostgresContainer psql -U $PostgresUser -d $PostgresDb -t -A -c $Sql 2>&1
        if ($LASTEXITCODE -eq 0) {
            return ($output | Out-String).Trim()
        }

        $dockerError = ($output | Out-String)
        if ($dockerError -notmatch "No such container" -and $dockerError -notmatch "is not running") {
            throw "psql via docker failed: $dockerError"
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

    $jar = Get-ChildItem "$env:USERPROFILE\.m2\repository\org\postgresql\postgresql" -Recurse -Filter "postgresql-*.jar" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if ($null -eq $jar) {
        throw "No PostgreSQL access. Need Docker, local 'psql', or PostgreSQL JDBC jar."
    }

    $tmpDir = Join-Path $env:TEMP "pos-e2e-jdbc"
    New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
    $javaFile = Join-Path $tmpDir "JdbcScalar.java"
    $source = @"
import java.sql.*;

public class JdbcScalar {
    public static void main(String[] args) throws Exception {
        try (Connection connection = DriverManager.getConnection(args[0], args[1], args[2]);
             Statement statement = connection.createStatement()) {
            boolean hasResultSet = statement.execute(args[3]);
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
    & javac -cp $jar.FullName $javaFile | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "javac JDBC helper failed" }
    $jdbcUrl = "jdbc:postgresql://$PostgresHost`:$PostgresPort/$PostgresDb"
    $output = & java -cp "$tmpDir;$($jar.FullName)" JdbcScalar $jdbcUrl $PostgresUser $PostgresPassword $Sql 2>&1
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

$sql = @"
with e2e_products as (
    select id from products where sku like 'ET-%'
), e2e_branches as (
    select id from branches where code like 'BR-E2E-%'
), e2e_suppliers as (
    select id from suppliers where code like 'SUP-E2E-%'
), e2e_users as (
    select id from users where username like 'user_e2e_%'
), e2e_orders as (
    select id from orders where cashier_id in (select id from e2e_users)
    union
    select order_id from order_items where product_id in (select id from e2e_products)
), deleted_payments as (
    delete from payments where order_id in (select id from e2e_orders) returning id
), deleted_order_items as (
    delete from order_items where order_id in (select id from e2e_orders) returning id
), deleted_stock_movements as (
    delete from stock_movements where product_id in (select id from e2e_products) or branch_id in (select id from e2e_branches) returning id
), deleted_sale_items as (
    delete from sale_items where product_id in (select id from e2e_products) or sale_id in (select id from sales where branch_id in (select id from e2e_branches)) returning id
), deleted_purchase_items as (
    delete from purchase_items where product_id in (select id from e2e_products) or purchase_id in (select id from purchases where branch_id in (select id from e2e_branches) or supplier_id in (select id from e2e_suppliers)) returning id
), deleted_orders as (
    delete from orders where id in (select id from e2e_orders) returning id
), deleted_sales as (
    delete from sales where branch_id in (select id from e2e_branches) returning id
), deleted_purchases as (
    delete from purchases where branch_id in (select id from e2e_branches) or supplier_id in (select id from e2e_suppliers) returning id
), deleted_adjustments as (
    delete from inventory_adjustments where product_id in (select id from e2e_products) returning id
), deleted_audit_logs as (
    delete from audit_logs where entity_name in ('PurchaseEntity','SaleEntity','BranchEntity','SupplierEntity','ProductEntity','UserEntity','OrderEntity','PaymentEntity') and (
        entity_id in (select id from e2e_products)
        or entity_id in (select id from e2e_branches)
        or entity_id in (select id from e2e_suppliers)
        or entity_id in (select id from e2e_users)
        or entity_id in (select id from e2e_orders)
    ) returning id
), deleted_users as (
    delete from users where id in (select id from e2e_users) returning id
), deleted_products as (
    delete from products where id in (select id from e2e_products) returning id
), deleted_suppliers as (
    delete from suppliers where id in (select id from e2e_suppliers) returning id
), deleted_branches as (
    delete from branches where id in (select id from e2e_branches) returning id
)
select concat(
    'users=', (select count(*) from deleted_users),
    ', orders=', (select count(*) from deleted_orders),
    ', order_items=', (select count(*) from deleted_order_items),
    ', payments=', (select count(*) from deleted_payments),
    ', products=', (select count(*) from deleted_products),
    ', suppliers=', (select count(*) from deleted_suppliers),
    ', branches=', (select count(*) from deleted_branches),
    ', purchases=', (select count(*) from deleted_purchases),
    ', sales=', (select count(*) from deleted_sales),
    ', purchase_items=', (select count(*) from deleted_purchase_items),
    ', sale_items=', (select count(*) from deleted_sale_items),
    ', stock_movements=', (select count(*) from deleted_stock_movements),
    ', inventory_adjustments=', (select count(*) from deleted_adjustments),
    ', audit_logs=', (select count(*) from deleted_audit_logs)
);
"@

$result = Invoke-SqlScalar $sql
Write-Host "Cleanup result: $result"
