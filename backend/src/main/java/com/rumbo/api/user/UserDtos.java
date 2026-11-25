package com.rumbo.api.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class UserDtos {
    private UserDtos() {
    }

    /** Letters (any language) with single spaces, apostrophes or hyphens between words. */
    private static final String NAME = "^\\p{L}+(?:[ '\\-]\\p{L}+)*$";

    public record UserDto(Long id, String firstName, String lastName, String email, Role role) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getRole());
        }
    }

    public record RegisterRequest(
            @NotBlank(message = "Escribe tu nombre.")
            @Size(max = 60, message = "El nombre admite hasta 60 caracteres.")
            @Pattern(regexp = NAME, message = "El nombre solo puede tener letras.") String firstName,
            @NotBlank(message = "Escribe tu apellido.")
            @Size(max = 60, message = "El apellido admite hasta 60 caracteres.")
            @Pattern(regexp = NAME, message = "El apellido solo puede tener letras.") String lastName,
            @NotBlank(message = "Escribe tu correo electrónico.")
            @Email(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message = "Escribe un correo válido, por ejemplo nombre@correo.com.")
            @Size(max = 120, message = "El correo admite hasta 120 caracteres.") String email,
            @NotBlank(message = "Crea una contraseña.")
            @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.")
            @Pattern(regexp = "^(?=.*\\p{L})(?=.*\\d).+$", message = "La contraseña debe tener al menos una letra y un número.") String password) {
    }

    public record LoginRequest(
            @NotBlank(message = "Escribe tu correo electrónico.") String email,
            @NotBlank(message = "Escribe tu contraseña.") String password) {
    }

    public record EmailRequest(@NotBlank(message = "Escribe tu correo electrónico.") String email) {
    }

    public record RoleRequest(@NotNull(message = "Indica el rol.") Role role) {
    }

    public record LoginResponse(String token, UserDto user) {
    }
}
