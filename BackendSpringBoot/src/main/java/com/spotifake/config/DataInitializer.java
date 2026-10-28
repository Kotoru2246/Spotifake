package com.spotifake.config;

import com.spotifake.entity.Role;
import com.spotifake.entity.Song;
import com.spotifake.entity.User;
import com.spotifake.repository.SongRepository;
import com.spotifake.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SongRepository songRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed Admin User
            User admin = User.builder()
                    .username("admin")
                    .email("admin@spotifake.com")
                    .password(passwordEncoder.encode("admin123"))
                    .displayName("Administrator")
                    .role(Role.ROLE_ADMIN)
                    .isActive(true)
                    .build();
            userRepository.save(admin);

            // Seed Normal User
            User user = User.builder()
                    .username("user1")
                    .email("user1@spotifake.com")
                    .password(passwordEncoder.encode("user123"))
                    .displayName("Regular User")
                    .role(Role.ROLE_USER)
                    .isActive(true)
                    .build();
            userRepository.save(user);

            // Seed Artist User
            User artist = User.builder()
                    .username("artist1")
                    .email("artist1@spotifake.com")
                    .password(passwordEncoder.encode("artist123"))
                    .displayName("Alan Walker")
                    .role(Role.ROLE_ARTIST)
                    .isActive(true)
                    .build();
            userRepository.save(artist);

            // Seed Initial Songs
            Song song1 = Song.builder()
                    .title("Faded")
                    .artistName("Alan Walker")
                    .albumName("Different World")
                    .genre("Electronic")
                    .durationSeconds(212)
                    .audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")
                    .coverArtUrl("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4")
                    .bpm(90.0f)
                    .energy(0.65f)
                    .valence(0.55f)
                    .playCount(120L)
                    .uploadedBy(artist)
                    .build();
            songRepository.save(song1);

            Song song2 = Song.builder()
                    .title("Spectre")
                    .artistName("Alan Walker")
                    .albumName("Singles")
                    .genre("EDM")
                    .durationSeconds(190)
                    .audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3")
                    .coverArtUrl("https://images.unsplash.com/photo-1470225620780-dba8ba36b745")
                    .bpm(128.0f)
                    .energy(0.85f)
                    .valence(0.70f)
                    .playCount(95L)
                    .uploadedBy(artist)
                    .build();
            songRepository.save(song2);

            Song song3 = Song.builder()
                    .title("Chill Sunset")
                    .artistName("Lofi Dreamer")
                    .albumName("Relaxing Beats")
                    .genre("Lofi")
                    .durationSeconds(155)
                    .audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3")
                    .coverArtUrl("https://images.unsplash.com/photo-1518609878373-06d740f60d8b")
                    .bpm(78.0f)
                    .energy(0.35f)
                    .valence(0.40f)
                    .playCount(250L)
                    .uploadedBy(user)
                    .build();
            songRepository.save(song3);

            System.out.println(">>> Sample seed data created successfully! Admin: admin/admin123, User: user1/user123");
        }
    }
}
