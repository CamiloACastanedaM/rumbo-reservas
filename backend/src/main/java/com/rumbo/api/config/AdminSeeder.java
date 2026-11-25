package com.rumbo.api.config;

import com.rumbo.api.user.Role;
import com.rumbo.api.user.User;
import com.rumbo.api.user.UserRepository;
import com.rumbo.api.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


/** Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD when that account doesn't exist yet. */
@Component
public class AdminSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    public AdminSeeder(UserRepository users, PasswordEncoder encoder,
                       @Value("${app.admin.email:}") String email, @Value("${app.admin.password:}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.email = UserService.normalize(email);
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isEmpty() || password.isEmpty()) {
            log.warn("ADMIN_EMAIL / ADMIN_PASSWORD no están configurados: no se crea el administrador inicial.");
            return;
        }
        if (users.existsByEmail(email)) return;
        User admin = new User();
        admin.setFirstName("Administrador");
        admin.setLastName("Rumbo");
        admin.setEmail(email);
        admin.setPasswordHash(encoder.encode(password));
        admin.setRole(Role.ADMIN);
        users.save(admin);
    }
}
