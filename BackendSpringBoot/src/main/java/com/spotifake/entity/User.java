package com.spotifake.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "Users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "UserID")
    private UUID id;

    @Column(name = "Username", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "Email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "PasswordHash", nullable = false, length = 255)
    private String password;

    @Column(name = "DisplayName", length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "Role", nullable = false, length = 50)
    private Role role = Role.ROLE_USER;

    @Column(name = "ProfileImageUrl", length = 500)
    private String profileImageUrl;

    @Column(name = "IsActive")
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt;
}
