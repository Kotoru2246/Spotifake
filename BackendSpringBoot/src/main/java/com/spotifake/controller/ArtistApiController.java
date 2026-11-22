package com.spotifake.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Canonical JSON endpoints for public artist pages.
 * The implementation lives in {@link ArtistController#getArtistDetails}, which also
 * serves the legacy /artist/details route used by spotifake_mobile.
 */
@RestController
@RequestMapping("/api/artists")
public class ArtistApiController {

    private final ArtistController artistController;

    public ArtistApiController(ArtistController artistController) {
        this.artistController = artistController;
    }

    @GetMapping({"", "/{artistId}"})
    public ResponseEntity<?> getArtistDetails(@PathVariable(required = false) String artistId,
                                              @RequestParam(value = "artistId", required = false) String artistParam,
                                              @RequestParam(value = "name", required = false) String nameParam) {
        return artistController.getArtistDetails(artistId, artistParam, nameParam);
    }
}
