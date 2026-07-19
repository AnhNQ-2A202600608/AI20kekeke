# Kế hoạch: Xây dựng DAG Kiến thức Toán lớp 6

> **Trạng thái:** DRAFT — Chưa thực thi  
> **Ngày tạo:** 2026-07-18  
> **Course ID:** `cf76850d-0738-50c3-bf34-1c464fa3b4d3`  
> **Mục tiêu:** Biến 110 concept đang cô lập thành đồ thị DAG có thể dùng cho adaptive learning.

---

## Phase 1 — Gom nhóm (Consolidation)

Script: `scripts/consolidate_math_concepts.py`

Gộp các concept trùng lặp/quá nhỏ vào `aliases` của concept chính rồi `archive` concept con.

### 12 cặp gom nhóm rõ ràng (đã xác minh codes tồn tại trong DB)

| Concept bị archive | Thêm vào aliases của | Lý do |
|---|---|---|
| `cach-mo-ta-tap-hop` | `mo-ta-tap-hop` | Trùng nghĩa |
| `phep-chia-het` | `chia-het` | Phép chia hết = khái niệm chia hết |
| `tinh-chat-giao-hoan-cua-phep-cong` | `tinh-chat-giao-hoan` | Trường hợp riêng của giao hoán |
| `tinh-chat-ket-hop-cua-phep-cong` | `tinh-chat-ket-hop` | Trường hợp riêng của kết hợp |
| `quy-tac-bang-nhau` | `phan-so-bang-nhau` | Quy tắc = định nghĩa phân số bằng nhau |
| `phan-so-toi-gian` | `rut-gon-phan-so` | Tối giản = kết quả của rút gọn |
| `bo-dau-ngoc` | `quy-tac-dau-ngoc` | Kỹ năng con của quy tắc |
| `so-nguyen-duong` | `so-nguyen` | Số nguyên dương đã có trong số tự nhiên |
| `tinh-chat-cua-phep-cong-phan-so` | `phep-cong-hai-phan-so-cung-mau` | Tính chất = phần của phép cộng phân số |
| `tong-gia-tri-chu-so` | `dau-hieu-chia-het` | Dùng trong dấu hiệu chia hết cho 3, 9 |
| `luu-y-khi-tinh-phan-so` | `quy-tac-chia-hai-phan-so` | Lưu ý = phần ghi chú của phép chia |
| `thuc-hien-phep-chia-het` | `chia-het` | Kỹ năng thực hiện = con của khái niệm |

### 48 skill concepts → archive thành aliases

| Skill concept | → Alias của |
|---|---|
| `cong-hai-so-tu-nhien` | `phep-cong` |
| `tru-hai-so-tu-nhien` | `phep-tru` |
| `thuc-hien-phep-nhan` | `phep-nhan` |
| `thuc-hien-phep-chia` | `phep-chia` |
| `so-lien-truoc-so-lien-sau-bai-tap` | `so-lien-truoc-so-lien-sau` |
| `so-sanh-hai-so-tu-nhien` | `khai-niem-so-tu-nhien` |
| `nhan-biet-uoc-boi` | `uoc` |
| `tinh-boi-chung-nho-nhat` | `boi-chung-nho-nhat` |
| `tim-so-doi` | `so-doi` |
| `thuc-hien-phep-cong-tru-hai-so-nguyen` | `cong-hai-so-nguyen-cung-dau` |
| `quy-dong-mau-nhieu-phan-so` | `quy-dong-mau-so` |
| `nhan-bang-thua-so-phu` | `quy-dong-mau-so` |
| `so-sanh-phan-so-cung-mau` | `so-sanh-phan-so` |
| `tinh-gia-tri-bieu-thuc-voi-phan-so` | `quy-tac-chia-hai-phan-so` |
| `viet-phan-so-duoi-dang-hon-so` | `hon-so-duong` |
| `phan-so-thap-phan-sang-so-thap-phan` | `phan-so-thap-phan` |
| `so-sanh-hai-so-thap-phan` | `so-thap-phan-duong` |
| `lam-tron-den-hang-chuc` | `lam-tron-so-thap-phan` |
| `lam-tron-den-hang-phan-mười` | `lam-tron-so-thap-phan` |
| `tinh-gia-tri-bieu-thuc-so-thap-phan` | `phep-cong-so-thap-phan` |
| `do-do-dai` | `do-dai-doan-thang` |
| `so-sanh-do-dai` | `do-dai-doan-thang` |
| `tinh-do-dai-doan-thang` | `do-dai-doan-thang` |
| `kiem-tra-trung-diem` | `trung-diem-cua-doan-thang` |
| `do-goc` | `so-do-goc` |
| `mo-ta-yeu-to-hinh` | `hinh-vuong` |
| `nhan-dang-hinh` | `hinh-vuong` |
| `nhan-biet-hinh-co-tam-doi-xung` | `hinh-co-tam-doi-xung` |
| `nhan-biet-tam-doi-xung` | `tam-doi-xung` |
| `tao-lap-hinh-luc-giac` | `hinh-luc-giac-deu` |
| `lap-bang-thong-ke` | `bang-thong-ke` |
| `bieu-dien-du-lieu` | `bang-thong-ke` |
| `ve-bieu-do-cot` | `bieu-do-cot` |
| `thuc-hanh-ve-bieu-do-cot` | `bieu-do-cot` |
| `doc-phan-tich-du-lieu` | `bieu-do-cot` |
| `doc-va-mo-ta-du-lieu` | `bieu-do-cot` |
| `nhan-ra-van-de-tu-bieu-do` | `bieu-do-cot` |
| `nhan-ra-quy-luat-tu-bieu-do` | `bieu-do-cot-kep` |
| `ve-bieu-do-cot-kep` | `bieu-do-cot-kep` |
| `liet-ke-ket-qua-co-the` | `ket-qua-co-the` |
| `nhan-biet-su-kien` | `su-kien` |
| `nhan-biet-tinh-khong-doan-truoc` | `su-kien` |
| `thong-ke-ket-qua-thi-nghiem` | `xac-suat-thuc-nghiem` |
| `tinh-xac-suat-thuc-nghiem` | `xac-suat-thuc-nghiem` |
| `tim-gia-tri-phan-tram` | `ti-so-phan-tram` |
| `tim-mot-so-khi-biet-phan-tram` | `ti-so-phan-tram` |
| `tinh-gia-tri-phan-tram` | `ti-so-phan-tram` |
| `tinh-ti-so-phan-tram` | `ti-so-phan-tram` |

**Kết quả Phase 1:** 110 concepts → **~65 main knowledge nodes** hoạt động.

---

## Phase 2 — Seed Quan hệ Prerequisite (DAG Edges)

Script: `scripts/seed_math_relations.py`

Tất cả codes đã xác minh tồn tại trong DB. `status = 'approved'`, `confidence = 1.0`.

### Mạch 1: Số tự nhiên (15 edges)
```
tap-hop                    → khai-niem-so-tu-nhien
khai-niem-so-tu-nhien      → phep-cong
khai-niem-so-tu-nhien      → phep-tru
phep-cong                  → phep-nhan
phep-nhan                  → phep-chia
phep-chia                  → phep-chia-co-du
phep-nhan                  → chia-het
chia-het                   → dau-hieu-chia-het
chia-het                   → so-nguyen-to
so-nguyen-to               → hop-so
chia-het                   → uoc
chia-het                   → boi
uoc                        → ucln
boi                        → boi-chung
boi-chung                  → boi-chung-nho-nhat
```

### Mạch 2: Số nguyên (8 edges)
```
khai-niem-so-tu-nhien      → so-nguyen-am
so-nguyen-am               → so-nguyen
so-nguyen                  → cong-hai-so-nguyen-cung-dau
so-nguyen                  → cong-hai-so-nguyen-khac-dau
so-nguyen                  → quy-tac-tru-hai-so-nguyen
so-nguyen                  → nhan-hai-so-nguyen-cung-dau
so-nguyen                  → nhan-hai-so-nguyen-khac-dau
so-nguyen                  → so-sanh-hai-so-nguyen
```

### Mạch 3: Phân số (18 edges)
```
phep-chia                  → phan-so
phan-so                    → tu-so-mau-so
phan-so                    → phan-so-bang-nhau
phan-so-bang-nhau          → rut-gon-phan-so
ucln                       → rut-gon-phan-so
boi-chung-nho-nhat         → quy-dong-mau-so
quy-dong-mau-so            → so-sanh-phan-so
quy-dong-mau-so            → phep-cong-hai-phan-so-cung-mau
phep-cong-hai-phan-so-cung-mau → phep-tru-hai-phan-so
phan-so                    → quy-tac-nhan-hai-phan-so
quy-tac-nhan-hai-phan-so   → phan-so-nghich-dao
phan-so-nghich-dao         → quy-tac-chia-hai-phan-so
phan-so                    → hon-so-duong
phan-so                    → ti-so
ti-so                      → ti-so-phan-tram
phan-so                    → phan-so-thap-phan
ti-so-phan-tram            → tim-gia-tri-phan-so-cua-mot-so-cho-truoc
ti-so-phan-tram            → tim-mot-so-biet-gia-tri-phan-so-cua-no
```

### Mạch 4: Số thập phân (8 edges)
```
phan-so-thap-phan          → so-thap-phan-duong
so-thap-phan-duong         → lam-tron-so-thap-phan
so-thap-phan-duong         → phep-cong-so-thap-phan
so-thap-phan-duong         → phep-tru-so-thap-phan
so-thap-phan-duong         → phep-nhan-so-thap-phan
so-thap-phan-duong         → phep-chia-so-thap-phan
so-thap-phan-duong         → so-thap-phan-am
so-thap-phan-duong         → tinh-chat-bang-cau
```

### Mạch 5: Hình học phẳng (23 edges)
```
khai-niem-so-tu-nhien      → doan-thang
doan-thang                 → do-dai-doan-thang
doan-thang                 → duong-thang-di-qua-hai-diem
doan-thang                 → ba-diem-thang-hang
doan-thang                 → trung-diem-cua-doan-thang
duong-thang-di-qua-hai-diem → duong-thang-cat-nhau
duong-thang-di-qua-hai-diem → duong-thang-song-song
duong-thang-di-qua-hai-diem → duong-thang-trung-nhau
doan-thang                 → tia
tia                        → goc
goc                        → so-do-goc
so-do-goc                  → goc-vuong
so-do-goc                  → goc-nhon
so-do-goc                  → goc-tu
so-do-goc                  → goc-bet
goc-vuong                  → hinh-vuong
hinh-vuong                 → dien-tich-hinh-vuong
hinh-vuong                 → chu-vi-hinh-vuong
doan-thang                 → chu-vi-hinh-chu-nhat
chu-vi-hinh-chu-nhat       → dien-tich-hinh-chu-nhat
dien-tich-hinh-binh-hanh   → dien-tich-hinh-thang
hinh-vuong                 → tam-doi-xung
tam-doi-xung               → hinh-co-tam-doi-xung
```

### Mạch 6: Thống kê & Xác suất (8 edges)
```
du-lieu                    → thu-thap-du-lieu
thu-thap-du-lieu           → bang-thong-ke
bang-thong-ke              → bieu-do-tranh
bang-thong-ke              → bieu-do-cot
bieu-do-cot                → bieu-do-cot-kep
ket-qua-co-the             → su-kien
su-kien                    → ti-so-xac-suat-thuc-nghiem
ti-so-xac-suat-thuc-nghiem → xac-suat-thuc-nghiem
```

**Tổng: 80 edges `prerequisite_of`**

---

## Phase 3 — Verify

Built-in vào script `seed_math_relations.py`:
1. **Cycle detection** trước khi insert — dùng DFS
2. **Orphan check** sau insert — query active concepts không có edge nào
3. **Count verification** — đảm bảo đủ 80 edges với `status = 'approved'`

---

## Concepts chưa có edge (để bổ sung sau)

Các concept hình học còn lại chưa được kết nối vào đồ thị:
- `chu-vi-hinh-binh-hanh`, `dien-tich-hinh-binh-hanh`
- `chu-vi-hinh-thoi`, `dien-tich-hinh-thoi`
- `chu-vi-hinh-thang`
- `hinh-luc-giac-deu`, `hinh-tam-giac-deu`
- `khoang-cach`, `canh-dinh-goc`
- `giao-cua-hai-tap-hop`
- `tinh-chat-giao-hoan`, `tinh-chat-ket-hop`, `tinh-chat-phan-phoi`, `tinh-chat-phep-nhan`
- `quy-tac-dau-ngoc`, `uoc-luong-ket-qua`
- `so-doi`, `truc-so`, `tap-hop-so-nguyen`
- `du-lieu-khong-hop-li`, `du-lieu-khong-phai-la-so`, `so-lieu`
- `mau-so-chung`, `tinh-chat-phan-so`
