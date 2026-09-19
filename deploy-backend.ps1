# deploy-backend.ps1
# Mirrors the project's api\ folder into XAMPP's htdocs\api\.
# Run this any time you edit a PHP file under api\.

$source = "C:\Users\Andrews\inventory-dashboard\api"
$dest   = "C:\xampp\htdocs\api"

Write-Host "Deploying backend: $source -> $dest" -ForegroundColor Cyan

robocopy $source $dest /MIR /XF "db_config.php" /NFL /NDL /NJH

$code = $LASTEXITCODE
if ($code -le 7) {
    Write-Host "Backend deployed successfully." -ForegroundColor Green
} else {
    Write-Host "Robocopy reported an error (exit code $code). Check output above." -ForegroundColor Red
}