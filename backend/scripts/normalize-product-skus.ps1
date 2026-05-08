param(
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432,
    [string]$PostgresDb = "pos_db",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "postgres"
)

$ErrorActionPreference = "Stop"

$regex = '^[A-Z0-9]{2,6}(-[A-Z0-9]{1,8}){2,7}$'

function Invoke-QueryRows {
    param([string]$Sql)

    $jar = Get-ChildItem "$env:USERPROFILE\.m2\repository\org\postgresql\postgresql" -Recurse -Filter "postgresql-*.jar" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if ($null -eq $jar) {
        throw "No PostgreSQL JDBC jar in Maven cache."
    }

    $tmpDir = Join-Path $env:TEMP "pos-normalize-sku"
    New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
    $javaFile = Join-Path $tmpDir "SqlQuery.java"
    $source = @"
import java.sql.*;
public class SqlQuery {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection(args[0], args[1], args[2]);
         Statement s = c.createStatement();
         ResultSet rs = s.executeQuery(args[3])) {
      ResultSetMetaData md = rs.getMetaData();
      int n = md.getColumnCount();
      while (rs.next()) {
        for (int i = 1; i <= n; i++) {
          if (i > 1) System.out.print("\t");
          Object v = rs.getObject(i);
          System.out.print(v == null ? "" : v.toString().replace("\t", " ").replace("\n", " ").replace("\r", " "));
        }
        System.out.println();
      }
    }
  }
}
"@
    [System.IO.File]::WriteAllText($javaFile, $source, (New-Object System.Text.UTF8Encoding($false)))

    & javac -cp $jar.FullName $javaFile | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "javac SqlQuery failed" }

    $jdbcUrl = "jdbc:postgresql://$PostgresHost`:$PostgresPort/$PostgresDb"
    $raw = & java -cp "$tmpDir;$($jar.FullName)" SqlQuery $jdbcUrl $PostgresUser $PostgresPassword $Sql 2>&1
    if ($LASTEXITCODE -ne 0) { throw "java SqlQuery failed: $($raw | Out-String)" }
    return ($raw | Out-String).Trim()
}

function Invoke-NonQuery {
    param([string]$Sql)

    $jar = Get-ChildItem "$env:USERPROFILE\.m2\repository\org\postgresql\postgresql" -Recurse -Filter "postgresql-*.jar" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if ($null -eq $jar) {
        throw "No PostgreSQL JDBC jar in Maven cache."
    }

    $tmpDir = Join-Path $env:TEMP "pos-normalize-sku"
    New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
    $javaFile = Join-Path $tmpDir "SqlExec.java"
    $source = @"
import java.sql.*;
public class SqlExec {
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
    if ($LASTEXITCODE -ne 0) { throw "javac SqlExec failed" }

    $jdbcUrl = "jdbc:postgresql://$PostgresHost`:$PostgresPort/$PostgresDb"
    $out = & java -cp "$tmpDir;$($jar.FullName)" SqlExec $jdbcUrl $PostgresUser $PostgresPassword $Sql 2>&1
    if ($LASTEXITCODE -ne 0) { throw "java SqlExec failed: $($out | Out-String)" }
}

function Resolve-CategoryCode {
    param([string]$Category)
    $c = if ($null -eq $Category) { "" } else { $Category.ToLowerInvariant() }
    if ($c -match "do uong" -or $c -match "drink") { return "DRK" }
    if ($c -match "do an" -or $c -match "food") { return "FOD" }
    if ($c -match "trang mieng" -or $c -match "dessert") { return "DST" }
    if ($c -match "topping") { return "TPG" }
    if ($c -match "ao" -or $c -match "shirt") { return "SHT" }
    if ($c -match "quan" -or $c -match "pant") { return "PNT" }
    return "GEN"
}

function Resolve-SourceCode {
    param([string]$Name)
    $n = if ($null -eq $Name) { "" } else { $Name.ToLowerInvariant() }
    if ($n -match "e2e") { return "E2E" }
    if ($n -match "demo") { return "DEM" }
    if ($n -match "invalid") { return "FIX" }
    return "STD"
}

$rowsRaw = Invoke-QueryRows "select id, coalesce(sku,''), coalesce(name,''), coalesce(category,'') from products order by id"
$rows = @()
if (-not [string]::IsNullOrWhiteSpace($rowsRaw)) {
    $rows = $rowsRaw -split "`n" | ForEach-Object {
        $parts = $_.Trim() -split "`t", 4
        [pscustomobject]@{
            id = [int64]$parts[0]
            sku = $parts[1]
            name = $parts[2]
            category = $parts[3]
        }
    }
}

$used = New-Object System.Collections.Generic.HashSet[string]
foreach ($row in $rows) { [void]$used.Add($row.sku) }

$updates = New-Object System.Collections.Generic.List[object]
foreach ($row in $rows) {
    $technicalPrefix = $row.sku -match '^(SKU|SP)-'
    if (($row.sku -match $regex) -and (-not $technicalPrefix)) { continue }

    $categoryCode = Resolve-CategoryCode $row.category
    $sourceCode = Resolve-SourceCode $row.name
    $base = "POS-$categoryCode-$sourceCode-" + ('{0:d4}' -f $row.id)
    $candidate = $base
    $suffix = 1
    while ($used.Contains($candidate)) {
        $candidate = "$base-$suffix"
        $suffix++
    }

    [void]$used.Add($candidate)
    $updates.Add([pscustomobject]@{ id = $row.id; oldSku = $row.sku; newSku = $candidate }) | Out-Null
}

if ($updates.Count -eq 0) {
    Write-Host "No invalid SKU found."
    exit 0
}

$sqlParts = New-Object System.Collections.Generic.List[string]
foreach ($u in $updates) {
    $oldEscaped = $u.oldSku.Replace("'", "''")
    $newEscaped = $u.newSku.Replace("'", "''")
    $sqlParts.Add("update products set sku = '$newEscaped' where id = $($u.id) and sku = '$oldEscaped';") | Out-Null
}

Invoke-NonQuery ($sqlParts -join ' ')

Write-Host "Normalized SKU count: $($updates.Count)"
$updates | Select-Object id, oldSku, newSku | Format-Table -Auto
