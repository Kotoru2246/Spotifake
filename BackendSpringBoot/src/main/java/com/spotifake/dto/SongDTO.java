package com.spotifake.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SongDTO {
    @NotBlank
    private String title;

    @NotBlank
    private String artistName;

    private String albumName;
    private String genre;
    private Integer durationSeconds;
    private String audioUrl;
    private String coverArtUrl;
    private Float bpm;
    private Float energy;
    private Float valence;
}
