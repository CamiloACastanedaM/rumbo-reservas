package com.rumbo.api.user;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthApiTest {
    @Autowired
    MockMvc mvc;
    @Autowired
    UserRepository users;
    @Autowired
    PasswordEncoder encoder;
    @MockitoBean
    MailService mail;

    @BeforeEach
    void clean() {
        users.deleteAll();
    }

    private String register(String first, String last, String email, String password) {
        return """
                {"firstName":"%s","lastName":"%s","email":"%s","password":"%s"}""".formatted(first, last, email, password);
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(body, "$.token");
    }

    private User saveUser(String email, Role role) {
        User u = new User();
        u.setFirstName("Ana");
        u.setLastName("Gómez");
        u.setEmail(email);
        u.setPasswordHash(encoder.encode("clave1234"));
        u.setRole(role);
        return users.save(u);
    }

    @Test
    void registerValidatesEveryField() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(register("Ana3", "", "ana@", "solotexto")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.firstName").value("El nombre solo puede tener letras."))
                .andExpect(jsonPath("$.fields.lastName").exists())
                .andExpect(jsonPath("$.fields.email").value(containsString("correo válido")))
                .andExpect(jsonPath("$.fields.password").value(containsString("una letra y un número")));
        verify(mail, never()).sendWelcome("Ana3", "ana@");
    }

    @Test
    void registerCreatesUserSendsWelcomeMailAndRejectsDuplicateEmail() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(register("María José", "Pérez-Díaz", "Maria@Correo.com", "viajar2026")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("maria@correo.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());
        verify(mail).sendWelcome("María José", "maria@correo.com");

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(register("Otra", "Persona", "maria@correo.com", "viajar2026")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Ya existe una cuenta")));

        mvc.perform(post("/api/auth/resend-confirmation").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"MARIA@correo.com\"}")).andExpect(status().isAccepted());
        verify(mail, org.mockito.Mockito.times(2)).sendWelcome("María José", "maria@correo.com");
    }

    @Test
    void loginReturnsTokenAndRejectsBadCredentials() throws Exception {
        saveUser("ana@correo.com", Role.USER);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ana@correo.com\",\"password\":\"otra1234\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(containsString("no son correctos")));

        String token = login("ANA@correo.com", "clave1234");
        mvc.perform(get("/api/users/me").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Ana"));
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer basura"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointsNeedTheAdminRole() throws Exception {
        saveUser("ana@correo.com", Role.USER);
        mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Inicia sesión para continuar."));
        mvc.perform(get("/api/admin/users").header("Authorization", login("ana@correo.com", "clave1234")))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/admin/products/1").header("Authorization", login("ana@correo.com", "clave1234")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminGrantsAndRevokesRoleButNotTheirOwn() throws Exception {
        User admin = saveUser("admin@correo.com", Role.ADMIN);
        User ana = saveUser("ana@correo.com", Role.USER);
        String adminToken = login("admin@correo.com", "clave1234");
        String anaToken = login("ana@correo.com", "clave1234");

        mvc.perform(patch("/api/admin/users/" + ana.getId() + "/role").header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("ADMIN"));
        mvc.perform(get("/api/admin/users").header("Authorization", anaToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));

        mvc.perform(patch("/api/admin/users/" + ana.getId() + "/role").header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"USER\"}"))
                .andExpect(status().isOk());
        // Same token, role revoked: refused at once.
        mvc.perform(get("/api/admin/users").header("Authorization", anaToken)).andExpect(status().isForbidden());

        mvc.perform(patch("/api/admin/users/" + admin.getId() + "/role").header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"USER\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("propio rol")));
    }
}
