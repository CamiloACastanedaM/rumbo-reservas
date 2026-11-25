package com.rumbo.api.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ProductForm(
        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 120, message = "El nombre admite hasta 120 caracteres.") String name,
        @NotBlank(message = "La descripción es obligatoria.")
        @Size(max = 2000, message = "La descripción admite hasta 2000 caracteres.") String description,
        @Size(max = 80, message = "La ciudad admite hasta 80 caracteres.") String city,
        @Size(max = 200, message = "La dirección admite hasta 200 caracteres.") String address,
        @DecimalMin(value = "0", message = "El precio no puede ser negativo.") BigDecimal pricePerNight,
        Long categoryId,
        List<Long> featureIds,
        /** On edit: existing image URLs to keep, in order. New uploads are appended after them. */
        List<String> keepImages,
        /** Policies as two parallel lists (same index = same policy), easy to send in a multipart form. */
        List<@Size(max = 80, message = "El título de la política admite hasta 80 caracteres.") String> policyTitles,
        List<@Size(max = 1000, message = "La descripción de la política admite hasta 1000 caracteres.") String> policyDescriptions,
        /** Host's WhatsApp with country code, e.g. 57 300 123 4567. Stored as digits only. */
        @Pattern(regexp = "^$|^\\+?[0-9 ()-]{8,20}$", message = "Escribe el WhatsApp con el indicativo del país, solo números (ej.: 57 300 123 4567).")
        String whatsappPhone) {
}
