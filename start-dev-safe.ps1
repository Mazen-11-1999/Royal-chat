# تشغيل التطبيق بشكل آمن - بدون حلقة لا نهائية
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  تشغيل التطبيق بشكل آمن" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. إيقاف جميع عمليات Node.js أولاً
Write-Host "[1] جاري إيقاف جميع عمليات Node.js..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "gnode" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✓ تم إيقاف جميع عمليات Node.js" -ForegroundColor Green
} catch {
    Write-Host "✓ لا توجد عمليات Node.js قيد التشغيل" -ForegroundColor Green
}
Write-Host ""

# 2. الحصول على IP المحلي
Write-Host "[2] جاري الحصول على IP المحلي..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"} | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    $ipAddress = "192.168.1.104"
    Write-Host "⚠️  لم يتم العثور على IP، استخدام: $ipAddress" -ForegroundColor Yellow
} else {
    Write-Host "✓ IP المحلي: $ipAddress" -ForegroundColor Green
}
Write-Host ""

# 3. إنشاء ملف .env.local
Write-Host "[3] جاري إنشاء ملف .env.local..." -ForegroundColor Yellow
$envContent = @"
NEXT_PUBLIC_APP_URL=http://$ipAddress:4000
NEXT_PUBLIC_WS_URL=ws://$ipAddress:4000
ALLOWED_ORIGINS=http://$ipAddress:4000
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -Force
Write-Host "✓ تم إنشاء .env.local" -ForegroundColor Green
Write-Host ""

# 4. التحقق من المنفذ
Write-Host "[4] التحقق من المنفذ 4000..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  المنفذ 4000 مستخدم، جاري إيقاف العملية..." -ForegroundColor Yellow
    $processId = ($portInUse | Select-Object -First 1).OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        Write-Host "✓ تم إيقاف العملية" -ForegroundColor Green
    }
} else {
    Write-Host "✓ المنفذ 4000 متاح" -ForegroundColor Green
}
Write-Host ""

# 5. عرض المعلومات
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  معلومات الاتصال:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  على الكمبيوتر:" -ForegroundColor White
Write-Host "  http://localhost:4000" -ForegroundColor Green
Write-Host ""
Write-Host "  على المحاكي (IP المحلي):" -ForegroundColor White
Write-Host "  http://$ipAddress:4000" -ForegroundColor Green
Write-Host ""
Write-Host "  على محاكي Android Studio:" -ForegroundColor White
Write-Host "  http://10.0.2.2:4000" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 6. تشغيل التطبيق مرة واحدة فقط
Write-Host "[5] جاري تشغيل التطبيق..." -ForegroundColor Yellow
Write-Host "  اضغط Ctrl+C لإيقاف التطبيق" -ForegroundColor Yellow
Write-Host "  ⚠️  لا تغلق هذا النافذة!" -ForegroundColor Red
Write-Host ""

# تشغيل التطبيق مرة واحدة فقط - بدون حلقة
Set-Location $PSScriptRoot
npm run dev


