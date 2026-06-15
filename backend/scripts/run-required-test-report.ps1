$ErrorActionPreference = "Stop"

$testSelector = "AuthControllerTest,ReportControllerTest,PurchaseServiceImplTest,SaleServiceImplTest,BranchProductStockServiceImplTest,BranchAccessGuardTest"

Write-Host "Dang chay cac bo kiem thu tich hop POS bat buoc..." -ForegroundColor Cyan
mvn -q "-Dtest=$testSelector" surefire:test --no-transfer-progress

$reportDir = Join-Path $PSScriptRoot "..\target\surefire-reports"
$reports = @{
    AuthControllerTest                = Join-Path $reportDir "com.pos.controllers.AuthControllerTest.txt"
    ReportControllerTest              = Join-Path $reportDir "com.pos.controllers.ReportControllerTest.txt"
    PurchaseServiceImplTest           = Join-Path $reportDir "com.pos.services.PurchaseServiceImplTest.txt"
    SaleServiceImplTest               = Join-Path $reportDir "com.pos.services.SaleServiceImplTest.txt"
    BranchProductStockServiceImplTest = Join-Path $reportDir "com.pos.services.BranchProductStockServiceImplTest.txt"
    BranchAccessGuardTest             = Join-Path $reportDir "com.pos.security.BranchAccessGuardTest.txt"
}

function Get-TestStatus($reportPath) {
    if (!(Test-Path $reportPath)) {
        return "THIEU FILE"
    }

    $content = Get-Content $reportPath -Raw
    if ($content -match "Failures:\s*0" -and $content -match "Errors:\s*0") {
        return "PASS"
    }

    return "THAT BAI"
}

$cases = @(
    [pscustomobject]@{ Suite = "Nhom 1 - Xac thuc & Phan quyen"; Case = "TC01"; Test = "Dang nhap thanh cong tra ve ma 200 kem accessToken va refreshToken"; Result = Get-TestStatus $reports.AuthControllerTest }
    [pscustomobject]@{ Suite = "Nhom 1 - Xac thuc & Phan quyen"; Case = "TC02"; Test = "Goi API bao mat khong co token Authorization tra ve ma 401 Unauthorized"; Result = Get-TestStatus $reports.AuthControllerTest }
    [pscustomobject]@{ Suite = "Nhom 1 - Xac thuc & Phan quyen"; Case = "TC03"; Test = "Co che RBAC chan tai khoan STAFF truy cap bao cao doanh thu voi ma 403 Forbidden"; Result = Get-TestStatus $reports.ReportControllerTest }
    [pscustomobject]@{ Suite = "Nhom 2 - Nhap hang & Ton kho"; Case = "TC04"; Test = "Tao phieu nhap hang hop le giup tang ton kho chi nhanh va ghi nhan bien dong IN"; Result = Get-TestStatus $reports.PurchaseServiceImplTest }
    [pscustomobject]@{ Suite = "Nhom 2 - Nhap hang & Ton kho"; Case = "TC05"; Test = "Chan dieu chinh ton kho thu cong neu lam cho so luong ton kho chi nhanh bi am"; Result = Get-TestStatus $reports.BranchProductStockServiceImplTest }
    [pscustomobject]@{ Suite = "Nhom 3 - Ban hang quay POS"; Case = "TC06"; Test = "Tao hoa don ban hang hop le giup tru ton kho chi nhanh va ghi nhan bien dong OUT"; Result = Get-TestStatus $reports.SaleServiceImplTest }
    [pscustomobject]@{ Suite = "Nhom 3 - Ban hang quay POS"; Case = "TC07"; Test = "Chan hoa don ban hang neu so luong mua lon hon so luong ton kho hien tai"; Result = Get-TestStatus $reports.SaleServiceImplTest }
    [pscustomobject]@{ Suite = "Nhom 4 - Bao mat Chi nhanh"; Case = "TC08"; Test = "Chan tai khoan STAFF truy cap cheo du lieu cua chi nhanh khac cu ma 403 Forbidden"; Result = Get-TestStatus $reports.BranchAccessGuardTest }
)

Write-Host ""
Write-Host "KET QUA KIEM THU POS BAT BUOC" -ForegroundColor Green
Write-Host "========================================"

$cases | Format-Table Suite, Case, Test, Result -AutoSize -Wrap

if ($cases.Result -contains "THAT BAI" -or $cases.Result -contains "THIEU FILE") {
    Write-Host "CANH BAO: Co bai test bi that bai hoac thieu du lieu bao cao!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "TAT CA BAI TEST DA VUOT QUA THANH CONG (BUILD SUCCESS)!" -ForegroundColor Green
}