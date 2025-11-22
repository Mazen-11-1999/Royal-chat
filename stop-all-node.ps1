# إيقاف جميع عمليات Node.js
Write-Host "========================================" -ForegroundColor Red
Write-Host "  إيقاف جميع عمليات Node.js" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

Write-Host "[1] جاري البحث عن عمليات Node.js..." -ForegroundColor Yellow

# إيقاف جميع عمليات Node.js
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
$gnodeProcesses = Get-Process -Name "gnode" -ErrorAction SilentlyContinue
$npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue

$totalCount = 0

if ($nodeProcesses) {
    $count = $nodeProcesses.Count
    $totalCount += $count
    Write-Host "  وجدت $count عملية node.exe" -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ تم إيقاف عمليات node.exe" -ForegroundColor Green
}

if ($gnodeProcesses) {
    $count = $gnodeProcesses.Count
    $totalCount += $count
    Write-Host "  وجدت $count عملية gnode.exe" -ForegroundColor Yellow
    $gnodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ تم إيقاف عمليات gnode.exe" -ForegroundColor Green
}

if ($npmProcesses) {
    $count = $npmProcesses.Count
    $totalCount += $count
    Write-Host "  وجدت $count عملية npm" -ForegroundColor Yellow
    $npmProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ تم إيقاف عمليات npm" -ForegroundColor Green
}

if ($totalCount -eq 0) {
    Write-Host "  ✓ لا توجد عمليات Node.js قيد التشغيل" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  ✓ تم إيقاف $totalCount عملية بنجاح" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  تم الإكمال!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Red


