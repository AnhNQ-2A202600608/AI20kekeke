# setup_dev_links.ps1
# Script hỗ trợ đồng bộ cục bộ thư mục adr-writer giữa .claude và .agents thông qua Directory Junction (Windows)

$claudePath = ".claude\skills\adr-writer"
$agentsPath = ".agents\skills\adr-writer"
$agentsParent = ".agents\skills"

# 1. Kiểm tra hệ điều hành Windows
if ($OS -notmatch "Windows" -and $env:OS -notmatch "Windows") {
    Write-Host "[INFO] Script nay chi can thiet tren Windows. Tren Linux/macOS, ban co the dung 'ln -s' binh thuong." -ForegroundColor Yellow
    exit 0
}

# 2. Đảm bảo thư mục cha tồn tại
if (!(Test-Path $agentsParent)) {
    New-Item -ItemType Directory -Path $agentsParent -Force | Out-Null
    Write-Host "[+] Da tao thu muc $agentsParent" -ForegroundColor Green
}

# 3. Tạo Junction liên kết nếu chưa tồn tại
if (Test-Path $agentsPath) {
    # Kiểm tra xem có phải là Junction hay không
    $item = Get-Item $agentsPath
    if ($item.Attributes -match "ReparsePoint") {
        Write-Host "[OK] Junction da ton tai va dang hoat dong tot." -ForegroundColor Green
    } else {
        Write-Host "[!] Thu muc $agentsPath da ton tai va la thu muc vat ly." -ForegroundColor Yellow
        Write-Host "[i] De dong bo hoa, hay chay lenh xoa thu muc vat ly nay va chay lai script." -ForegroundColor Cyan
    }
} else {
    New-Item -ItemType Junction -Path $agentsPath -Value $claudePath | Out-Null
    Write-Host "[+] Tao lien ket Junction thanh cong!" -ForegroundColor Green
    Write-Host "[i] Ke tu gio, moi thay doi tren file cua adr-writer o mot trong hai thu muc se tu dong dong bo sang ben con lai." -ForegroundColor Cyan
}
