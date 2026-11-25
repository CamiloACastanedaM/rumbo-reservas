package com.rumbo.api.user;

import com.rumbo.api.common.ApiException;
import com.rumbo.api.user.UserDtos.*;
import com.rumbo.api.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class UserService {
    private static final String EMAIL_IN_USE = "Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.";
    private final UserRepository repository;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final MailService mail;

    public UserService(UserRepository repository, PasswordEncoder encoder, JwtService jwt, MailService mail) {
        this.repository = repository;
        this.encoder = encoder;
        this.jwt = jwt;
        this.mail = mail;
    }

    @Transactional
    public UserDto register(RegisterRequest req) {
        String email = normalize(req.email());
        if (repository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, EMAIL_IN_USE);
        }
        User user = new User();
        user.setFirstName(req.firstName().trim());
        user.setLastName(req.lastName().trim());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(req.password()));
        try {
            user = repository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(HttpStatus.CONFLICT, EMAIL_IN_USE);
        }
        mail.sendWelcome(user.getFirstName(), user.getEmail());
        return UserDto.from(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        return repository.findByEmail(normalize(req.email()))
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .map(u -> new LoginResponse(jwt.issue(u.getId()), UserDto.from(u)))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "El correo o la contraseña no son correctos. Revísalos e intenta de nuevo."));
    }

    /** Same answer whether or not the account exists, so the endpoint can't be used to probe emails. */
    @Transactional(readOnly = true)
    public void resendWelcome(String email) {
        repository.findByEmail(normalize(email))
                .ifPresent(u -> mail.sendWelcome(u.getFirstName(), u.getEmail()));
    }

    @Transactional(readOnly = true)
    public UserDto me(Long id) {
        return repository.findById(id).map(UserDto::from)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Inicia sesión para continuar."));
    }

    @Transactional(readOnly = true)
    public List<UserDto> list() {
        return repository.findAllByOrderByIdAsc().stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto setRole(Long currentUserId, Long id, Role role) {
        if (id.equals(currentUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No puedes cambiar tu propio rol. Pídeselo a otro administrador.");
        }
        User user = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ese usuario ya no existe."));
        user.setRole(role);
        return UserDto.from(user);
    }

    /** Emails are stored trimmed and lowercased, so lookups are exact matches. */
    public static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
