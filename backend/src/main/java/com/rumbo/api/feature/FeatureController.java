package com.rumbo.api.feature;

import com.rumbo.api.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class FeatureController {
    private static final String NAME_IN_USE = "Ya existe una característica con ese nombre.";
    private final FeatureRepository repository;

    public FeatureController(FeatureRepository repository) {
        this.repository = repository;
    }

    public record FeatureDto(Long id, String name, String icon) {
        public static FeatureDto from(Feature f) {
            return new FeatureDto(f.getId(), f.getName(), f.getIcon());
        }
    }

    public record FeatureForm(
            @NotBlank(message = "El nombre es obligatorio.")
            @Size(max = 60, message = "El nombre admite hasta 60 caracteres.") String name,
            @NotBlank(message = "Elige un ícono.")
            @Pattern(regexp = "^[a-z0-9-]{1,40}$", message = "Elige un ícono de la lista.") String icon) {
    }

    @GetMapping("/features")
    public List<FeatureDto> list() {
        return repository.findAllByOrderByNameAsc().stream().map(FeatureDto::from).toList();
    }

    @PostMapping("/admin/features")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public FeatureDto create(@Valid @RequestBody FeatureForm form) {
        if (repository.existsByNameIgnoreCase(form.name().trim())) {
            throw new ApiException(HttpStatus.CONFLICT, NAME_IN_USE);
        }
        return save(new Feature(), form);
    }

    @PutMapping("/admin/features/{id}")
    @Transactional
    public FeatureDto update(@PathVariable Long id, @Valid @RequestBody FeatureForm form) {
        Feature feature = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Esa característica ya no existe."));
        if (repository.existsByNameIgnoreCaseAndIdNot(form.name().trim(), id)) {
            throw new ApiException(HttpStatus.CONFLICT, NAME_IN_USE);
        }
        return save(feature, form);
    }

    @DeleteMapping("/admin/features/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Esa característica ya no existe.");
        }
        repository.unlinkFromProducts(id);
        repository.deleteById(id);
    }

    private FeatureDto save(Feature feature, FeatureForm form) {
        feature.setName(form.name().trim());
        feature.setIcon(form.icon());
        try {
            return FeatureDto.from(repository.saveAndFlush(feature));
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(HttpStatus.CONFLICT, NAME_IN_USE);
        }
    }
}
