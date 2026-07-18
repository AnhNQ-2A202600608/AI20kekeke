# run_demo.ps1
Clear-Host
Write-Host '===================================================' -ForegroundColor Green
Write-Host '   MENTORA DEMO & TESTING CONTROLLER PANEL          ' -ForegroundColor Green
Write-Host '===================================================' -ForegroundColor Green
Write-Host '1. Chạy toàn bộ kiểm thử tự động (pytest)'
Write-Host '2. Chạy Backend (FastAPI trên port 8000)'
Write-Host '3. Chạy Frontend (Next.js trên port 3000)'
Write-Host '4. Seed + demo cá nhân hóa (Trần Minh lớp 7 — hổng gốc phân số lớp 5)'
Write-Host '5. Thoát'
Write-Host '===================================================' -ForegroundColor Green
$choice = Read-Host 'Nhập lựa chọn của bạn (1-5)'

switch ($choice) {
    '1' {
        Write-Host 'Đang chạy pytest...' -ForegroundColor Yellow
        .venv\Scripts\pytest
    }
    '2' {
        Write-Host 'Đang khởi chạy backend uvicorn trên port 8000...' -ForegroundColor Yellow
        .venv\Scripts\uvicorn src.main:app --port 8000
    }
    '3' {
        Write-Host 'Đang khởi chạy Next.js frontend...' -ForegroundColor Yellow
        cd frontend
        npm run dev
    }
    '4' {
        Write-Host 'Đang seed dữ liệu demo và chạy chẩn đoán cá nhân hóa...' -ForegroundColor Yellow
        $env:PYTHONPATH = '.'
        .venv\Scripts\python scripts\seed_demo_minh.py
    }
    default {
        Write-Host 'Đã thoát.'
    }
}
