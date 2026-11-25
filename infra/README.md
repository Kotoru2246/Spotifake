# Hạ tầng Spotifake

| Công cụ | File |
|---|---|
| Dockerfile | `BackendSpringBoot/Dockerfile`, `BackendAI/Dockerfile`, `EssentiaService/Dockerfile` |
| Docker Compose | `docker-compose.yml`, `.env.example` |
| Jenkins | `Jenkinsfile` |
| Prometheus, Blackbox | `infra/prometheus/` |
| Grafana | `infra/grafana/` |
| Kubernetes | `infra/k8s/` |

Lệnh bên dưới chạy trong PowerShell, tại thư mục gốc dự án.

## Chạy Jenkins

Job `spotifake` lấy code từ nhánh `main` trên GitHub, nên thay đổi trên máy chỉ có tác dụng sau khi push.

Jenkins tự tạo `INTERNAL_API_TOKEN` và mật khẩu Grafana trong workspace, không cần tạo credential.

1. Chuẩn bị thư mục dữ liệu cho bản triển khai (mặc định `C:\Users\jacky\SpotifakeDemo`) chứa một bản sao
   `backendai.db`. Không trỏ vào database mà backend chạy ngoài Docker đang dùng.
   Nhạc lấy từ `E:\Spotifake\uploads` và `E:\Spotifake\music` (tham số `UPLOADS_DIR`, `MUSIC_DIR`).
2. SonarQube cần webhook về Jenkins để bước Quality Gate nhận kết quả:
   `http://portal-jenkins:8080/sonarqube-webhook/` (hai container cùng mạng `cicd-portal`).
3. Mở http://localhost:8089 → job `spotifake` → Build Now (hoặc Build with Parameters).

| Dịch vụ | Địa chỉ |
|---|---|
| Web | http://localhost:8085 |
| Prometheus | http://localhost:9090 (chỉ máy này) |
| Grafana | http://localhost:3030 (chỉ máy này, xem không cần đăng nhập) |

Lỗi thường gặp:

| Dấu hiệu | Nguyên nhân |
|---|---|
| Quality Gate chờ 5 phút rồi dừng | Webhook ở bước 2 sai hoặc chưa có |
| `backendai.db` thành thư mục trong container | Thư mục ở bước 1 chưa có file database |

Image do Jenkins build không có file model `.pth` / `.joblib` (git bỏ qua), nên AI dùng cách phân loại dự phòng.

## Chạy Kubernetes (Docker Desktop)

1. Docker Desktop → Settings → Kubernetes → Enable Kubernetes (chọn kiểu **Kubeadm** để dùng được image build trên máy).
2. Build image:

```powershell
docker compose build
```

   Lệnh này cần file `.env` (chép từ `.env.example`).

3. Tạo namespace và Secret. Thay `<chuoi-bi-mat>` bằng chuỗi của bạn, không ghi vào file:

```powershell
kubectl apply -f infra/k8s/namespace.yaml
```

```powershell
kubectl -n spotifake create secret generic spotifake-secrets --from-literal=internal-api-token=<chuoi-bi-mat>
```

4. Triển khai và xem trạng thái:

```powershell
kubectl apply -k infra/k8s
```

```powershell
kubectl -n spotifake get pods
```

5. Mở web http://localhost:30085 và Prometheus http://localhost:30909.
   Trang admin tự chuyển sang cổng 9000, nên dùng port-forward:

```powershell
kubectl -n spotifake port-forward svc/backend 8000:8000 9000:9000
```

   (Cần tắt backend chạy trên máy trước.)

Gỡ toàn bộ (xóa cả dữ liệu trong cluster):

```powershell
kubectl delete namespace spotifake
```

## Khái niệm Kubernetes trong các file này

| Khái niệm | Ý nghĩa | Ở đâu |
|---|---|---|
| Namespace | Vùng riêng cho dự án | `namespace.yaml` |
| Pod | Đơn vị nhỏ nhất, chứa container | `template` trong Deployment |
| Deployment | Giữ đúng số pod (`replicas`), cập nhật phiên bản | mọi file service |
| Service | Tên và địa chỉ cố định cho pod | `ClusterIP` (nội bộ), `NodePort` (mở ra máy) |
| Secret | Lưu thông tin bí mật | `spotifake-secrets` |
| PersistentVolumeClaim | Xin ổ đĩa để giữ dữ liệu | `backend.yaml` |
| initContainer | Chạy xong trước container chính | `init-db` |
| Probe | startup / readiness / liveness: kiểm tra sức khỏe | các Deployment |
