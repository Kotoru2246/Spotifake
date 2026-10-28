package com.spotifake.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "Songs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "SongID")
    private UUID id;

    @Column(name = "Title", nullable = false, length = 255)
    private String title;

    @Column(name = "ArtistName", nullable = false, length = 255)
    private String artistName;

    @Column(name = "AlbumName", length = 255)
    private String albumName;

    @Column(name = "Genre", length = 100)
    private String genre;

    @Column(name = "DurationSeconds")
    private Integer durationSeconds;

    @Column(name = "AudioUrl", nullable = false, length = 500)
    private String audioUrl;

    @Column(name = "CoverArtUrl", length = 500)
    private String coverArtUrl;

    @Column(name = "PlayCount")
    private Long playCount = 0L;

    // AI Audio analysis features (Librosa / Essentia compat)
    @Column(name = "Bpm")
    private Float bpm;

    @Column(name = "Energy")
    private Float energy;

    @Column(name = "Valence")
    private Float valence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UploadedByUserID")
    private User uploadedBy;

    @CreationTimestamp
    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt;
}
