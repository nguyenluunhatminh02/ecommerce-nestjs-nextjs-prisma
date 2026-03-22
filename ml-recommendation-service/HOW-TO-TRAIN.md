# Hướng Dẫn Chạy và Train ML Recommendation Service

## Tổng quan

Service này là một hệ thống gợi ý sản phẩm (recommendation) chạy bằng Python/FastAPI. Nó cần được **train** (học từ dữ liệu) trước khi có thể đưa ra gợi ý. Quá trình train đọc dữ liệu hành vi người dùng từ PostgreSQL, tính toán mô hình, rồi lưu file `.pkl` vào thư mục `ml/models/`.

---

## Yêu cầu

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| Docker + Docker Compose | 24+ | Cách chạy được khuyến nghị |
| Python | 3.11+ | Nếu chạy tay (không dùng Docker) |
| PostgreSQL | 15+ | Database chứa dữ liệu đơn hàng, review, v.v. |
| Redis | 7+ | Cache kết quả gợi ý |

---

## Cách 1: Chạy bằng Docker (Khuyến nghị)

### Bước 1 — Cấu hình biến môi trường

Tạo file `.env` trong thư mục `ml-recommendation-service/`:

```env
# Database — trỏ đến PostgreSQL của backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce

# Redis
REDIS_URL=redis://localhost:6379

# Bảo mật API (tùy chọn, dùng để gọi API từ bên ngoài)
API_KEY=your-secret-key-here

# Cấu hình model (để mặc định nếu không chắc)
SVD_N_COMPONENTS=50
SVD_N_ITER=10
NMF_N_COMPONENTS=50
NMF_MAX_ITER=200

# Dữ liệu training: số ngày lịch sử lấy từ DB
TRAINING_DATA_DAYS=180

# Số tương tác tối thiểu để đưa user/sản phẩm vào training
MIN_USER_INTERACTIONS=5
MIN_PRODUCT_INTERACTIONS=3

# Tỷ lệ train/test split (0.8 = 80% train, 20% test)
TRAIN_TEST_SPLIT=0.8
```

> **Lưu ý quan trọng:** `DATABASE_URL` phải trỏ đúng đến PostgreSQL của backend NestJS — đây là nơi chứa đơn hàng, đánh giá, giỏ hàng, wishlist của người dùng. Không có dữ liệu này thì không thể train.

### Bước 2 — Chạy Docker Compose

```bash
# Trong thư mục ml-recommendation-service/
cd ml-recommendation-service

docker-compose up -d
```

Docker sẽ khởi động 3 container:
- `ml-recommendation` — service Python FastAPI (port **8000**)
- `postgres` — database (port **5432**)
- `redis` — cache (port **6379**)

> **Nếu bạn đã có PostgreSQL và Redis riêng** (từ backend NestJS), chỉ cần chạy mỗi service ML:
> ```bash
> docker build -t ml-recommendation .
> docker run -d -p 8000:8000 --env-file .env ml-recommendation
> ```

### Bước 3 — Kiểm tra service đã chạy

```bash
curl http://localhost:8000/health
```

Kết quả mong đợi:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "models_trained": false
}
```

Lúc này `models_trained: false` là bình thường — chưa train.

---

## Cách 2: Chạy thủ công (Không dùng Docker)

### Bước 1 — Cài đặt Python dependencies

```bash
cd ml-recommendation-service

# Tạo virtual environment
python -m venv venv

# Kích hoạt (Windows)
venv\Scripts\activate

# Kích hoạt (Linux/Mac)
source venv/bin/activate

# Cài packages
pip install -r requirements.txt
```

### Bước 2 — Đặt biến môi trường

```bash
# Windows PowerShell
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ecommerce"
$env:REDIS_URL = "redis://localhost:6379"

# Linux/Mac
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce"
export REDIS_URL="redis://localhost:6379"
```

Hoặc tạo file `.env` như Cách 1.

### Bước 3 — Chạy server

```bash
# Từ thư mục ml-recommendation-service/
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Trigger Training (Bắt model học)

Sau khi server đang chạy và database đã có dữ liệu người dùng, gọi API để bắt đầu training:

### Kích hoạt training

```bash
# Train cả 2 model (SVD + NMF) — khuyến nghị
curl -X POST http://localhost:8000/api/v1/training/train \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "all", "force_retrain": false}'
```

```bash
# Train riêng SVD
curl -X POST http://localhost:8000/api/v1/training/train \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "svd", "force_retrain": false}'

# Train riêng NMF
curl -X POST http://localhost:8000/api/v1/training/train \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "nmf", "force_retrain": false}'
```

Kết quả trả về ngay lập tức (training chạy ngầm):
```json
{
  "training_id": "a1b2c3d4-...",
  "status": "started",
  "message": "Training job initiated"
}
```

Lưu lại `training_id` để theo dõi tiến độ.

### Theo dõi tiến độ training

```bash
curl http://localhost:8000/api/v1/training/status/{training_id}
```

Thay `{training_id}` bằng giá trị nhận được ở bước trên.

Ví dụ kết quả đang chạy:
```json
{
  "status": "in_progress",
  "progress": 65,
  "message": "Training NMF model..."
}
```

Ví dụ kết quả hoàn thành:
```json
{
  "status": "completed",
  "progress": 100,
  "message": "Training completed successfully",
  "models": {
    "svd": { "status": "completed", "metrics": {...} },
    "nmf": { "status": "completed", "metrics": {...} }
  }
}
```

### Kiểm tra models đã sẵn sàng

```bash
curl http://localhost:8000/ready
```

Trả về `"ready"` khi models đã được train. Trả về `"not_ready"` nếu chưa.

```bash
# Xem metrics của các models đã train
curl http://localhost:8000/api/v1/training/metrics
```

---

## Kiểm tra gợi ý sau khi train

```bash
# Lấy gợi ý cho user cụ thể (thay USER_ID bằng UUID thật)
curl "http://localhost:8000/api/v1/recommendations/users/USER_ID?limit=10&algorithm=ensemble"

# Sản phẩm tương tự
curl "http://localhost:8000/api/v1/recommendations/products/PRODUCT_ID/similar?limit=5"

# Sản phẩm trending
curl "http://localhost:8000/api/v1/recommendations/trending?limit=10"
```

---

## File model được lưu ở đâu?

Sau khi training thành công, hai file sẽ được tạo (hoặc ghi đè) trong:

```
ml-recommendation-service/
  ml/
    models/
      SVD_model.pkl    ← model SVD đã train
      NMF_model.pkl    ← model NMF đã train
```

Hai file `.pkl` này chứa toàn bộ "trí tuệ" đã học được. Bạn có thể sao lưu chúng và load lại bất kỳ lúc nào mà không cần train lại.

Đường dẫn mặc định được cấu hình trong `config.py`:
```python
svd_model_path: str = "ml/models/SVD_model.pkl"
nmf_model_path: str = "ml/models/NMF_model.pkl"
```

---

## Khi nào cần retrain?

| Tình huống | Cần retrain không? |
|---|---|
| Có thêm nhiều đơn hàng/đánh giá mới | Nên retrain định kỳ (hàng tuần/tháng) |
| Thêm sản phẩm mới vào catalog | Cần retrain để model biết sản phẩm mới |
| Lần đầu triển khai | Bắt buộc |
| Server restart | Không (models được load từ file `.pkl`) |
| Thay đổi hyperparameters | Cần retrain với `force_retrain: true` |

Để retrain dù model đã tồn tại:
```bash
curl -X POST http://localhost:8000/api/v1/training/train \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "all", "force_retrain": true}'
```

---

## Cấu hình quan trọng cần điều chỉnh theo quy mô

| Tham số | Mặc định | Ý nghĩa | Điều chỉnh khi |
|---|---|---|---|
| `SVD_N_COMPONENTS` | 50 | Số chiều ẩn của SVD | Tăng lên (100–200) khi có >10.000 sản phẩm |
| `NMF_N_COMPONENTS` | 50 | Số chiều ẩn của NMF | Tương tự SVD |
| `TRAINING_DATA_DAYS` | 180 | Lấy dữ liệu bao nhiêu ngày về trước | Giảm xuống 90 nếu DB lớn và chậm |
| `MIN_USER_INTERACTIONS` | 5 | User cần tối thiểu bao nhiêu tương tác | Tăng lên nếu muốn loại noise |
| `MIN_PRODUCT_INTERACTIONS` | 3 | Sản phẩm cần tối thiểu bao nhiêu tương tác | Tăng lên để loại sản phẩm ít phổ biến |

---

## Troubleshooting

### Training thất bại với "No interaction data available"
- Nguyên nhân: DB không có dữ liệu hoặc `DATABASE_URL` sai
- Kiểm tra: `curl http://localhost:8000/health` — xem `database: connected` chưa
- Kiểm tra lại connection string trong `.env`

### Training thất bại với "Not enough users/items"
- Nguyên nhân: Quá ít dữ liệu sau khi lọc bởi `MIN_USER_INTERACTIONS` / `MIN_PRODUCT_INTERACTIONS`
- Giải pháp: Giảm `MIN_USER_INTERACTIONS=2` và `MIN_PRODUCT_INTERACTIONS=1` trong `.env`

### Service khởi động nhưng models không load
- Nguyên nhân: File `.pkl` không tồn tại hoặc bị hỏng
- Giải pháp: Chạy training để tạo lại models

### `models_trained: false` sau khi train xong
- Nguyên nhân: Training job đang chạy background — cần đợi thêm
- Giải pháp: Poll endpoint `/api/v1/training/status/{training_id}` đến khi `status: completed`
