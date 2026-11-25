package com.rumbo.api.user;

import com.rumbo.api.user.UserDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final UserService service;

    public AuthController(UserService service) {
        this.service = service;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto register(@Valid @RequestBody RegisterRequest req) {
        return service.register(req);
    }

    @PostMapping("/auth/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }

    @PostMapping("/auth/resend-confirmation")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void resend(@Valid @RequestBody EmailRequest req) {
        service.resendWelcome(req.email());
    }

    /** Current user, so the app can refresh name and role after a change. */
    @GetMapping("/users/me")
    public UserDto me(@AuthenticationPrincipal Long userId) {
        return service.me(userId);
    }

    @GetMapping("/admin/users")
    public List<UserDto> users() {
        return service.list();
    }

    @PatchMapping("/admin/users/{id}/role")
    public UserDto setRole(@AuthenticationPrincipal Long userId, @PathVariable Long id, @Valid @RequestBody RoleRequest req) {
        return service.setRole(userId, id, req.role());
    }
}
