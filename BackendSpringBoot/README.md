# Spotifake - Spring Boot Backend

Module Backend viết bằng **Java & Spring Boot** cho dự án Spotifake, đáp ứng đầy đủ đề cương kiến thức:
- **Chương 1: Spring Core**: IoC, Dependency Injection (`@Autowired`, `@RequiredArgsConstructor`), Bean Management, AOP (`LoggingAspect`).
- **Chương 2: Spring Boot**: Auto-configuration, Spring MVC RESTful APIs (`@RestController`), Spring Data JPA (`JpaRepository`).
- **Chương 3: Security**: Spring Security 6, JWT Authentication (`JwtTokenProvider`, `JwtAuthenticationFilter`), Role-based access control (`ROLE_USER`, `ROLE_ARTIST`, `ROLE_ADMIN`).

---

## 1. Cấu trúc thư mục

```
BackendSpringBoot/
├── pom.xml                               # Quản lý dependencies (Spring Web, JPA, Security, JJWT, H2,...)
├── src/main/java/com/spotifake/
│   ├── SpotifakeApplication.java        # Class khởi chạy ứng dụng Spring Boot
│   ├── aspect/                          # AOP - Aspect Oriented Programming
│   │   └── LoggingAspect.java
│   ├── config/                          # Cấu hình Security, CORS, Seed Data
│   │   ├── SecurityConfig.java
│   │   └── DataInitializer.java
│   ├── controller/                      # REST Controllers (Spring MVC)
│   │   ├── AuthController.java          # Đăng ký, đăng nhập
│   │   ├── SongController.java          # API bài hát, tìm kiếm, play
│   │   └── PlaylistController.java      # Quản lý danh sách phát
│   ├── dto/                             # Data Transfer Objects
│   │   ├── AuthResponse.java
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   └── SongDTO.java
│   ├── entity/                          # JPA Entities mapping database
│   │   ├── Role.java
│   │   ├── User.java
│   │   ├── Song.java
│   │   └── Playlist.java
│   ├── repository/                      # Spring Data JPA Repositories
│   │   ├── UserRepository.java
│   │   ├── SongRepository.java
│   │   └── PlaylistRepository.java
│   ├── security/                        # JWT & UserDetailsService
│   │   ├── CustomUserDetailsService.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── JwtTokenProvider.java
│   └── service/                         # Business Logic Services
│       ├── AuthService.java
│       ├── SongService.java
│       └── PlaylistService.java
└── src/main/resources/
    └── application.properties           # Cấu hình DB, Port 8080, JWT Secret
```

---

## 2. Cách chạy trên Terminal

### Yêu cầu:
- Java JDK 17+ (Máy bạn đã có JDK 24 tại `C:\Program Files\Java\jdk-24`).
- Maven (hoặc chạy trực tiếp trên IntelliJ IDEA / Eclipse / VS Code).

### Lệnh chạy với Maven:
```powershell
cd BackendSpringBoot
mvn clean spring-boot:run
```

Hoặc mở thư mục `BackendSpringBoot` trong **IntelliJ IDEA** / **Eclipse** và bấm Run class `SpotifakeApplication.java`.

---

## 3. Tài khoản mẫu có sẵn (Auto Seeded)

Khi ứng dụng khởi chạy lần đầu, `DataInitializer` sẽ tự động tạo dữ liệu mẫu:

| Username | Password | Quyền (Role) |
| :--- | :--- | :--- |
| `admin` | `admin123` | `ROLE_ADMIN` |
| `artist1` | `artist123` | `ROLE_ARTIST` |
| `user1` | `user123` | `ROLE_USER` |

---

## 4. Danh sách RESTful API

| Method | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới | Public |
| `POST` | `/api/auth/login` | Đăng nhập lấy Bearer JWT token | Public |
| `GET` | `/api/songs` | Lấy danh sách toàn bộ bài hát | Public |
| `GET` | `/api/songs/{id}` | Lấy chi tiết bài hát theo ID | Public |
| `GET` | `/api/songs/search?query=...` | Tìm kiếm bài hát theo tên hoặc ca sĩ | Public |
| `GET` | `/api/songs/top` | Top bài hát nghe nhiều nhất | Public |
| `POST` | `/api/songs` | Thêm/Upload bài hát mới | Cần JWT (USER/ARTIST/ADMIN) |
| `POST` | `/api/songs/{id}/play` | Tăng lượt nghe | Public |
| `GET` | `/api/playlists/public` | Lấy danh sách playlist công khai | Public |
| `GET` | `/api/playlists/my` | Lấy playlist cá nhân | Cần JWT |
| `POST` | `/api/playlists` | Tạo playlist mới | Cần JWT |
| `POST` | `/api/playlists/{pId}/tracks/{sId}` | Thêm bài hát vào playlist | Cần JWT |

---

## 5. Truy cập Console H2 Database
- URL: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
- JDBC URL: `jdbc:h2:mem:musicplayerdb`
- User Name: `sa`
- Password: *(để trống)*
