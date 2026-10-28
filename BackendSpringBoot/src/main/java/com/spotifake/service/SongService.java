package com.spotifake.service;

import com.spotifake.dto.SongDTO;
import com.spotifake.entity.Song;
import com.spotifake.entity.User;
import com.spotifake.repository.SongRepository;
import com.spotifake.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SongService {

    private final SongRepository songRepository;
    private final UserRepository userRepository;

    public List<Song> getAllSongs() {
        return songRepository.findAll();
    }

    public Song getSongById(UUID id) {
        return songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Song not found with id: " + id));
    }

    public List<Song> searchSongs(String query) {
        return songRepository.searchSongs(query);
    }

    public List<Song> getTopSongs() {
        return songRepository.findTop20ByOrderByPlayCountDesc();
    }

    public List<Song> getSongsByGenre(String genre) {
        return songRepository.findByGenreIgnoreCase(genre);
    }

    public Song createSong(SongDTO dto, String username) {
        User user = null;
        if (username != null) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        Song song = Song.builder()
                .title(dto.getTitle())
                .artistName(dto.getArtistName())
                .albumName(dto.getAlbumName())
                .genre(dto.getGenre())
                .durationSeconds(dto.getDurationSeconds())
                .audioUrl(dto.getAudioUrl() != null ? dto.getAudioUrl() : "")
                .coverArtUrl(dto.getCoverArtUrl() != null ? dto.getCoverArtUrl() : "")
                .bpm(dto.getBpm())
                .energy(dto.getEnergy())
                .valence(dto.getValence())
                .playCount(0L)
                .uploadedBy(user)
                .build();

        return songRepository.save(song);
    }

    public void incrementPlayCount(UUID songId) {
        Song song = getSongById(songId);
        song.setPlayCount(song.getPlayCount() + 1);
        songRepository.save(song);
    }
}
