package com.rumbo.api.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductForm(
        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 120, message = "El nombre admite hasta 120 caracteres.") String name,
        @NotBlank(message = "La descripción es obligatoria.")
        @Size(max = 2000, message = "La descripción admite hasta 2000 caracteres.") String description,
        @Size(max = 80, message = "La ciudad admite hasta 80 caracteres.") String city,
        @Size(max = 200, message = "La dirección admite hasta 200 caracteres.") String address,
        @DecimalMin(value = "0", message = "El precio no puede ser negativo.") BigDecimal pricePerNight) {
}
