package com.spotifake.controller;

import com.spotifake.model.User;
import com.spotifake.service.ShortcutService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final ShortcutService shortcutService;

    public MeController(ShortcutService shortcutService) {
        this.shortcutService = shortcutService;
    }

    @GetMapping("/shortcuts")
    public List<Map<String, Object>> shortcuts(@RequestParam(value = "limit", required = false) Integer limit,
                                               @AuthenticationPrincipal User user) {
        return shortcutService.getShortcuts(user, limit);
    }
}
