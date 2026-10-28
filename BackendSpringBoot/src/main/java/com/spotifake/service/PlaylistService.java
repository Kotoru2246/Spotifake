package com.spotifake.service;

import com.spotifake.entity.Playlist;
import com.spotifake.entity.Song;
import com.spotifake.entity.User;
import com.spotifake.repository.PlaylistRepository;
import com.spotifake.repository.SongRepository;
import com.spotifake.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final UserRepository userRepository;
    private final SongRepository songRepository;

    public List<Playlist> getPublicPlaylists() {
        return playlistRepository.findByIsPublicTrue();
    }

    public List<Playlist> getUserPlaylists(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return playlistRepository.findByUserId(user.getId());
    }

    public Playlist getPlaylistById(UUID id) {
        return playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));
    }

    public Playlist createPlaylist(String title, String description, boolean isPublic, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Playlist playlist = Playlist.builder()
                .title(title)
                .description(description)
                .isPublic(isPublic)
                .user(user)
                .build();

        return playlistRepository.save(playlist);
    }

    public Playlist addSongToPlaylist(UUID playlistId, UUID songId) {
        Playlist playlist = getPlaylistById(playlistId);
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        playlist.getTracks().add(song);
        return playlistRepository.save(playlist);
    }

    public Playlist removeSongFromPlaylist(UUID playlistId, UUID songId) {
        Playlist playlist = getPlaylistById(playlistId);
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        playlist.getTracks().remove(song);
        return playlistRepository.save(playlist);
    }
}
