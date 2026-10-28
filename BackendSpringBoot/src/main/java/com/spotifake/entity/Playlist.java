package com.spotifake.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "Playlists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Playlist {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "PlaylistID")
    private UUID id;

    @Column(name = "Title", nullable = false, length = 200)
    private String title;

    @Column(name = "Description", length = 1000)
    private String description;

    @Column(name = "IsPublic")
    private boolean isPublic = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToMany
    @JoinTable(
        name = "PlaylistTracks",
        joinColumns = @JoinColumn(name = "PlaylistID"),
        inverseJoinColumns = @JoinColumn(name = "SongID")
    )
    private Set<Song> tracks = new HashSet<>();

    @CreationTimestamp
    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt;
}
