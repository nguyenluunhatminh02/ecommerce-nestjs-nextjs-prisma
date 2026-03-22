# Giải Thích Logic ML — Hệ Thống Gợi Ý Sản Phẩm

> Tài liệu này giải thích toàn bộ cách hoạt động của service ML theo ngôn ngữ đời thường, không cần kiến thức Machine Learning để đọc hiểu.

---

## Bức tranh tổng thể: Hệ thống làm gì?

Hệ thống này trả lời 3 câu hỏi:

1. **"User A nên xem sản phẩm nào tiếp theo?"** → Gợi ý cá nhân hóa
2. **"Sản phẩm X thì giống sản phẩm nào khác?"** → Sản phẩm tương tự
3. **"Sản phẩm nào đang được mọi người quan tâm nhiều nhất?"** → Trending

Tất cả đều dựa trên **dữ liệu hành vi thực tế** của người dùng — không phải dựa trên mô tả sản phẩm hay danh mục.

---

## Phần 1: Dữ liệu đầu vào — Học từ hành vi người dùng

### Nguồn dữ liệu

Hệ thống đọc từ PostgreSQL tất cả hành vi của người dùng trong **180 ngày gần nhất**:

| Hành vi | Nguồn bảng DB | Ý nghĩa |
|---|---|---|
| Mua hàng | `orders` + `order_items` | Người dùng đã trả tiền mua |
| Đánh giá | `reviews` | Người dùng viết nhận xét |
| Thêm vào giỏ | `cart_items` | Quan tâm, có ý định mua |
| Thêm vào wishlist | `wishlists` | Lưu lại để xem sau |
| Xem sản phẩm | `recently_viewed` | Chỉ lướt qua |

### Điểm tương tác (Interaction Score)

Không phải hành vi nào cũng có giá trị như nhau. Hệ thống gán **trọng số** khác nhau:

```
Mua hàng  = 5.0  điểm  ← quan trọng nhất, thể hiện sự cam kết thực sự
Đánh giá  = 3.0  điểm  ← người dùng đã dùng và có ý kiến
Giỏ hàng  = 2.0  điểm  ← đang cân nhắc
Wishlist  = 1.5  điểm  ← quan tâm nhẹ
Xem       = 1.0  điểm  ← ít ý nghĩa nhất
```

**Ví dụ tính điểm:** User A mua sản phẩm X 2 lần → điểm = 5.0 × 2 = **10.0**

**Điều chỉnh đặc biệt cho đánh giá:** Nếu user đánh giá 4/5 sao → điểm = 3.0 × (4/5) = **2.4** — đánh giá thấp thì điểm cũng thấp hơn.

**Tại sao thiết kế vậy?** Vì hành động mua hàng nói lên nhiều hơn hành động chỉ xem. Hệ thống ưu tiên học từ tín hiệu mạnh hơn.

---

## Phần 2: Ma trận tương tác — Biểu diễn quan hệ người dùng–sản phẩm

### Ma trận là gì?

Hãy tưởng tượng một bảng Excel khổng lồ:
- **Mỗi hàng** = một người dùng
- **Mỗi cột** = một sản phẩm
- **Mỗi ô** = tổng điểm tương tác của người dùng đó với sản phẩm đó

```
          Áo T-Shirt  Điện thoại  Sách ML  Tai nghe
User A       10.0        0          3.0      0
User B        0          8.5        0        5.0
User C        2.0        7.0        0        6.5
User D        0          0          4.5      2.0
```

Ô có giá trị = người dùng đã tương tác. Ô bằng 0 = chưa tương tác. Trong thực tế, **hầu hết các ô đều bằng 0** vì mỗi người chỉ mua/xem một phần rất nhỏ catalog sản phẩm. Ma trận này được gọi là **sparse matrix** (ma trận thưa).

### Lọc bớt nhiễu

Trước khi train, hệ thống loại bỏ:
- User có **< 5 tương tác** → quá ít dữ liệu để học định vị
- Sản phẩm có **< 3 tương tác** → sản phẩm chưa có đủ phản hồi

---

## Phần 3: Hai thuật toán học — SVD và NMF

Đây là cốt lõi của hệ thống. Cả hai thuật toán đều giải quyết cùng một bài toán theo cách khác nhau:

**Bài toán:** Ma trận đầy lỗ trống (ô = 0 vì chưa tương tác). Làm sao đoán được nếu User A thấy sản phẩm X (mà họ chưa xem bao giờ), họ có thích không?

---

### Thuật toán 1: SVD (Singular Value Decomposition)

**Tên tiếng Việt:** Phân rã giá trị kỳ dị

#### Ý tưởng đơn giản

SVD không cố đoán từng ô một. Thay vào đó, nó tìm kiếm **các "chủ đề ẩn"** trong dữ liệu.

Ví dụ thực tế: Nếu nhiều người vừa mua "điện thoại Samsung" vừa mua "ốp lưng" và "sạc nhanh" — SVD tự nhận ra rằng có một "chủ đề ẩn" là **"phụ kiện điện thoại"**. Nó không được lập trình để hiểu điều này — nó tự tìm ra từ pattern.

#### Tư duy toán học (đơn giản)

SVD chia ma trận người dùng–sản phẩm thành 3 ma trận nhỏ hơn:

```
Ma trận gốc (Users × Products)
        =
  [Đặc điểm của Users]  ×  [Tầm quan trọng]  ×  [Đặc điểm của Products]
     (U)                       (Sigma)                    (V)
```

Trong đó:
- **U**: Mỗi người dùng được biểu diễn bằng một vector số (ví dụ: "mức độ thích đồ điện tử = 0.8, mức độ thích sách = 0.2, mức độ thích thời trang = 0.1")
- **V**: Mỗi sản phẩm cũng được biểu diễn bằng vector tương tự
- **Sigma**: Trọng số của từng "chủ đề ẩn"

Sau khi có U và V, để **dự đoán** user A thích sản phẩm X đến mức nào:
```
điểm dự đoán = vector của User A  ·  vector của Sản phẩm X
             (tích vô hướng — nhân từng chiều rồi cộng lại)
```

**Phép tính cuối cùng thực sự đơn giản đến vậy đó.** Phần phức tạp là tìm ra U và V sao cho khi tính lại về ma trận gốc thì sai số là nhỏ nhất.

#### Trong code

```python
# sklearn TruncatedSVD — chỉ lấy n_components "chủ đề ẩn" quan trọng nhất
# (mặc định 50 chủ đề)
self.svd_model = TruncatedSVD(n_components=50, algorithm='randomized')
self.svd_model.fit(interaction_matrix)

# User factors: mỗi user là 1 vector 50 chiều
self.user_factors = self.svd_model.transform(interaction_matrix)

# Item factors: mỗi sản phẩm là 1 vector 50 chiều
self.item_factors = self.svd_model.components_.T
```

**"50 components"** có nghĩa là hệ thống tìm 50 "chủ đề ẩn" thay vì hàng ngàn sản phẩm. Điều này giúp:
- Xử lý nhanh hơn rất nhiều
- Tự động lọc nhiễu (những tương tác ngẫu nhiên, không có pattern)
- Tổng quát hóa tốt hơn — từ ít dữ liệu vẫn suy ra được preferences

---

### Thuật toán 2: NMF (Non-negative Matrix Factorization)

**Tên tiếng Việt:** Phân rã ma trận không âm

#### Điểm khác biệt so với SVD

NMF giải cùng bài toán nhưng có một ràng buộc thêm: **tất cả các số đều phải ≥ 0**.

Điều này nghe có vẻ nhỏ nhặt nhưng thay đổi hoàn toàn cách hệ thống "suy nghĩ":

| | SVD | NMF |
|---|---|---|
| Số âm | Cho phép | Không cho phép |
| Kiểu học | User/sản phẩm có thể "chống lại" nhau | Mọi thứ đều cộng thêm vào nhau |
| Cách hiểu | Tìm trục gradient trong không gian | Mỗi user = tổng hợp của các "profile" |
| Dễ diễn giải | Khó | Dễ hơn |

#### Ví dụ trực quan

Tưởng tượng mỗi người dùng là một combo của nhiều "persona":
- Persona 1: "Tín đồ công nghệ" — thích điện thoại, laptop, tai nghe
- Persona 2: "Người yêu thể thao" — thích giày, đồ thể thao, bình nước
- Persona 3: "Người đọc sách" — thích sách, đèn học, cà phê

Với NMF, User A có thể là: **60% Tín đồ công nghệ + 30% Người yêu thể thao + 10% Người đọc sách**.

NMF tự tìm ra các "persona" này mà không cần ai định nghĩa trước — chỉ từ pattern mua hàng.

#### Trong code

```python
# sklearn NMF — phân rã thành W (user factors) × H (item factors)
self.nmf_model = NMF(n_components=50, solver='mu', beta_loss='frobenius')

# W: ma trận user-profile (n_users × 50)
W = self.nmf_model.fit_transform(dense_matrix)

# H: ma trận item-profile (50 × n_items)
H = self.nmf_model.components_
```

**Lưu ý:** NMF cần ma trận dense (không dùng sparse), nên tốn RAM nhiều hơn SVD khi catalog sản phẩm lớn.

---

### Ensemble — Kết hợp cả hai

Thay vì chọn một thuật toán, hệ thống có thể dùng **ensemble** — lấy trung bình kết quả cả hai:

```
Điểm cuối = 50% điểm SVD + 50% điểm NMF
```

**Tại sao lại tốt hơn?** Vì SVD và NMF nhìn dữ liệu theo góc khác nhau — đôi khi SVD đúng hơn, đôi khi NMF đúng hơn. Trung bình thường ổn định và chính xác hơn từng cái đơn lẻ.

---

## Phần 4: Quy trình training từ đầu đến cuối

```
Database (180 ngày dữ liệu)
          ↓
  [Data Service] đọc 5 loại tương tác
          ↓
  [Matrix Builder] tính điểm, xây ma trận Users × Products
          ↓
  Train/Test Split (80% / 20%)
          ↓
  ┌─────────────────┬──────────────────┐
  │   SVD Model     │    NMF Model     │
  │   (train 80%)   │    (train 80%)   │
  └────────┬────────┴───────┬──────────┘
           │                │
  Đánh giá trên 20% test data
           ↓
  Lưu file SVD_model.pkl + NMF_model.pkl
```

### Train/Test Split là gì?

Để biết model học tốt chưa, không thể hỏi model về dữ liệu nó đã thấy (như học sinh học thuộc đề). Nên:
- **80% (train set)**: model học từ đây
- **20% (test set)**: model CHƯA thấy — dùng để kiểm tra độ chính xác

---

## Phần 5: Đánh giá độ chính xác — Hệ thống biết nó đang tệ hay tốt

Sau khi train, hệ thống tự đánh giá bằng nhiều thước đo:

### RMSE và MAE — Sai số điểm dự đoán

- **RMSE** (Root Mean Square Error): Trung bình của sai số bình phương
- **MAE** (Mean Absolute Error): Trung bình của sai số tuyệt đối

**Ý nghĩa đơn giản:** Nếu điểm thật của user với sản phẩm là 8.0 mà model đoán 7.5 thì sai 0.5. Càng thấp càng tốt.

### Precision@K — Trong top K gợi ý, bao nhiêu % thực sự đúng?

Ví dụ Precision@10 = 0.7 → Trong 10 sản phẩm được gợi ý, có 7 sản phẩm mà user thực sự thích.

### Recall@K — Trong số tất cả sản phẩm user thích, model bắt được bao nhiêu phần trăm?

Ví dụ: User thích 20 sản phẩm, model gợi ý đúng 8 → Recall@10 = 8/20 = 0.4

### NDCG@K — Xếp hạng sản phẩm có đúng thứ tự ưu tiên không?

Không chỉ quan tâm model có gợi ý đúng không, mà còn quan tâm sản phẩm quan trọng nhất có được đặt lên đầu không. NDCG = 1.0 là hoàn hảo.

### Coverage — Model biết bao nhiêu phần của catalog?

Nếu catalog có 10.000 sản phẩm nhưng model chỉ gợi ý 500 sản phẩm khác nhau cho toàn bộ người dùng → coverage = 5%. Thấp quá nghĩa là model bị "thiên vị" về sản phẩm phổ biến.

---

## Phần 6: Sản phẩm tương tự — Cosine Similarity

Đây là tính năng riêng biệt ("người xem sản phẩm X cũng thích sản phẩm...").

### Ý tưởng

Mỗi sản phẩm đã có một **vector** (từ SVD/NMF). Hai sản phẩm được coi là tương tự nếu vector của chúng "chỉ về cùng hướng".

**Phép đo: Cosine Similarity** — đo góc giữa hai vector:
- Góc = 0° → giống hệt nhau → similarity = 1.0
- Góc = 90° → không liên quan → similarity = 0.0
- Góc = 180° → ngược nhau hoàn toàn → similarity = -1.0

```python
# Tính cosine similarity giữa product X và tất cả sản phẩm khác
from sklearn.metrics.pairwise import cosine_similarity
similarities = cosine_similarity([item_vector], all_item_factors)[0]
```

**Tại sao dùng cosine thay vì Euclidean distance?** Vì chúng ta quan tâm đến "hướng" (preferences), không phải "độ lớn" (mức độ nổi tiếng).

---

## Phần 7: Trending Products — Thuật toán điểm nóng

Không dùng ML — dùng **công thức tính điểm đơn giản** dựa trên hành vi 7 ngày gần nhất:

```
Trending Score = (số lượt mua × 5) + (số người mua khác nhau × 3) + (số lượt xem × 1)
```

**Tại sao không chỉ dùng view count?** Vì view dễ giả mạo và ít ý nghĩa. Một sản phẩm được 100 người **mua** có giá trị hơn 10.000 lượt **xem**.

```sql
-- Truy vấn thực tế trong data_service.py
SELECT 
    product_id,
    SUM(quantity) * 5 as purchase_score,      -- mua nhiều = quan trọng
    COUNT(DISTINCT user_id) * 3 as buyer_score, -- nhiều người khác nhau mua  
    COUNT(*) * 1 as view_score
FROM ...
ORDER BY total_score DESC
```

---

## Phần 8: Cold Start — Vấn đề người dùng mới

**Vấn đề:** User mới chưa có lịch sử tương tác. Model không biết vector của họ → không thể gợi ý cá nhân hóa.

**Giải pháp của hệ thống:** Fallback về **trending products** — gợi ý những sản phẩm đang hot nhất cho tất cả người dùng.

Đây là giải pháp đơn giản nhưng hợp lý. Trong thực tế production, người ta thường dùng thêm:
- Hỏi user sở thích khi đăng ký
- Dùng thông tin demographic (tuổi, giới tính) để estimate

---

## Phần 9: Redis Cache — Không tính đi tính lại

Tính toán ma trận factorization tốn thời gian. Mỗi lần user refresh trang không thể gọi model tính lại.

**Giải pháp:** Cache kết quả vào Redis có TTL (hết hạn):

```
Lần 1: User A → tính SVD → lưu vào Redis (TTL 1 giờ) → trả kết quả
Lần 2: User A → check Redis → hit cache → trả ngay, không tính lại
Lần 3 (sau 1 tiếng): Cache hết hạn → tính lại → lưu cache mới
```

---

## Phần 10: Đánh giá tổng thể — Logic có ổn không?

### Điểm mạnh của thiết kế

| Điểm | Giải thích |
|---|---|
| Dùng đúng thuật toán cho bài toán | SVD/NMF là chuẩn mực ngành cho collaborative filtering trên implicit data |
| Ensemble SVD + NMF | Giảm risk, thường tốt hơn từng cái đơn lẻ |
| Weighted interactions | Phân biệt tín hiệu mạnh (mua) vs yếu (xem) — đúng về mặt lý thuyết |
| Cache với Redis | Hợp lý cho production |
| Đánh giá đa chiều | RMSE + Precision/Recall + NDCG + Coverage — đầy đủ |
| Cold start fallback | Không để user mới thấy màn trống |

### Vấn đề cần cải thiện

| Vấn đề | Mô tả | Cách sửa |
|---|---|---|
| **Schema mismatch** | `recommendation_service.py` gán `rec.product_name`, `rec.product_price`, `rec.product_rating` nhưng Pydantic schema `RecommendationItem` không có các field này → lỗi runtime | Thêm các field optional vào schema hoặc xóa dòng gán |
| **Variable name shadow** | `training.py` dùng `status = training_service.get_training_status(...)` ghi đè biến import `from fastapi import status` → lỗi khi dùng `status.HTTP_404_NOT_FOUND` | Đổi tên biến thành `job_status` |
| **Duplicate UNION** | `data_service.py` `get_active_products()` UNION bảng `wishlists` hai lần → đếm wishlist gấp đôi | Xóa một UNION |
| **NMF RAM usage** | NMF convert sparse → dense trước khi train → tốn RAM rất lớn với catalog lớn (>50K sản phẩm) | Dùng `implicit` library thay sklearn NMF, hoặc giới hạn sản phẩm |
| **Cache serialize lỗi** | `cache_service.py` dùng `json.dumps()` trên Pydantic v2 objects → không serialize được | Dùng `model.model_dump_json()` trước khi cache |
| **CORS misconfiguration** | `cors_origins: ["*"]` kết hợp `allow_credentials: True` → browser từ chối | Không dùng wildcard khi cần credentials; liệt kê domain cụ thể |
| **Không có scheduled retraining** | Model không tự retrain định kỳ — phải gọi API thủ công | Thêm APScheduler hoặc Celery beat để retrain hàng ngày/tuần |

### Có "đủ thực tế" cho production không?

**Kết luận:** Đây là hệ thống ở mức **prototype đến early-stage production** — hoàn toàn phù hợp cho một ứng dụng e-commerce cỡ vừa (< 100K user, < 50K sản phẩm). 

- Với quy mô lớn hơn, cần thay NMF bằng thư viện optimize hơn như `implicit` (ALS) hoặc các hệ thống distributed như Spark ALS.
- Các bug nêu ở trên cần fix trước khi deploy.

---

## Tóm tắt pipeline trong 1 sơ đồ

```
                        ┌─────────────────────────────────────────┐
                        │         DATABASE (PostgreSQL)           │
                        │  orders, reviews, carts, wishlists,     │
                        │  recently_viewed — 180 ngày gần nhất    │
                        └──────────────────┬──────────────────────┘
                                           │ Đọc dữ liệu
                                           ▼
                        ┌─────────────────────────────────────────┐
                        │           DATA SERVICE                  │
                        │  Tính điểm: mua=5, review=3, cart=2,   │
                        │  wishlist=1.5, xem=1                    │
                        └──────────────────┬──────────────────────┘
                                           │ Aggregate theo user+product
                                           ▼
                        ┌─────────────────────────────────────────┐
                        │          MATRIX BUILDER                 │
                        │  Xây ma trận: Users × Products          │
                        │  Lọc: user <5 tương tác, SP <3 tương tác│
                        └──────────┬───────────────────────────────┘
                                   │ 80% train / 20% test
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
         ┌──────────────────┐           ┌──────────────────┐
         │    SVD MODEL     │           │    NMF MODEL     │
         │  Tìm 50 "chủ đề" │           │  Tìm 50 "persona"│
         │  ẩn trong data   │           │  cộng được       │
         │  → user vector   │           │  → user vector   │
         │  → item vector   │           │  → item vector   │
         └────────┬─────────┘           └─────────┬────────┘
                  │ Đánh giá trên 20% test          │
                  │ Lưu SVD_model.pkl               │ Lưu NMF_model.pkl
                  └──────────────┬──────────────────┘
                                 │ Khi user request
                                 ▼
              ┌──────────────────────────────────────┐
              │          ENSEMBLE (nếu chọn)         │
              │  Score = 50% SVD + 50% NMF           │
              └──────────────────┬───────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
          ┌──────────────────┐    ┌──────────────────────┐
          │  Cache (Redis)   │    │  Gợi ý trả về user   │
          │  TTL: 1 giờ      │    │  [sp1, sp2, sp3, ...] │
          └──────────────────┘    └──────────────────────┘
```
