# Hạ tầng Spotifake

| Công cụ | File |
|---|---|
| Dockerfile | `BackendSpringBoot/Dockerfile`, `BackendAI/Dockerfile`, `EssentiaService/Dockerfile` |
| Docker Compose | `docker-compose.yml`, `.env.example` |
| Jenkins | `Jenkinsfile` |
| Prometheus | `infra/prometheus/` |
| Kubernetes | `infra/k8s/` |

Lệnh bên dưới chạy trong PowerShell, tại thư mục gốc dự án.

## Chạy Jenkins

Job `spotifake` lấy code từ nhánh `main` trên GitHub, nên thay đổi trên máy chỉ có tác dụng sau khi push.

1. Commit và push.
2. Jenkins → Manage Jenkins → Credentials → Add: loại **Secret text**, ID `spotifake-internal-token`,
   giá trị là một chuỗi dài ngẫu nhiên.
3. SonarQube → Administration → Configuration → Webhooks → Create:
   URL `http://portal-jenkins:8080/sonarqube-webhook/` (hai container cùng mạng `cicd-portal`).
   Nếu Jenkins được đặt đường dẫn phụ (prefix) thì thêm vào trước `/sonarqube-webhook/`.
4. Tắt chương trình đang dùng cổng 3000 và 5000 trên máy (bản Essentia và AI chạy ngoài Docker).
5. Mở http://localhost:8089 → job `spotifake` → Build Now.
   Lần đầu Jenkins chưa biết tham số `DATA_DIR` và dùng giá trị mặc định trong Jenkinsfile.

Lỗi thường gặp:

| Dấu hiệu | Nguyên nhân |
|---|---|
| `spotifake-internal-token` not found | Chưa làm bước 2 |
| Quality Gate chờ 5 phút rồi dừng | Webhook ở bước 3 sai hoặc chưa có |
| `port is already allocated` | Chưa làm bước 4 |

Image do Jenkins build không có file model `.pth` / `.joblib` (git bỏ qua), nên AI không nhận diện được thể loại.

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
