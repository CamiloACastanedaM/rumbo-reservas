package com.rumbo.api.category;

import com.rumbo.api.common.ApiException;
import com.rumbo.api.product.ImageStorage;
import com.rumbo.api.product.ProductRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CategoryController {
    private static final String TITLE_IN_USE = "Ya existe una categoría con ese título.";
    private final CategoryRepository repository;
    private final ImageStorage storage;
    private final ProductRepository products;

    public CategoryController(CategoryRepository repository, ImageStorage storage, ProductRepository products) {
        this.repository = repository;
        this.storage = storage;
        this.products = products;
    }

    public record CategoryForm(
            @NotBlank(message = "El título es obligatorio.")
            @Size(max = 80, message = "El título admite hasta 80 caracteres.") String title,
            @NotBlank(message = "La descripción es obligatoria.")
            @Size(max = 500, message = "La descripción admite hasta 500 caracteres.") String description) {
    }

    public record AdminCategory(Long id, String title, String imageUrl, long productCount) {
    }

    /** Categories with how many products each one has, for the delete confirmation. */
    @GetMapping("/admin/categories")
    @Transactional(readOnly = true)
    public List<AdminCategory> adminList() {
        var counts = products.countByCategory().stream()
                .collect(java.util.stream.Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
        return repository.findAll(Sort.by("id")).stream()
                .map(c -> new AdminCategory(c.getId(), c.getTitle(), c.getImageUrl(), counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    @GetMapping("/categories")
    public List<CategoryDto> list() {
        return repository.findAll(Sort.by("id")).stream().map(CategoryDto::from).toList();
    }

    @PostMapping(value = "/admin/categories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto create(@Valid @ModelAttribute CategoryForm form,
                              @RequestParam(value = "image", required = false) MultipartFile image) {
        String title = form.title().trim();
        if (repository.existsByTitleIgnoreCase(title)) {
            throw new ApiException(HttpStatus.CONFLICT, TITLE_IN_USE);
        }
        if (image == null || image.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Agrega una imagen representativa de la categoría.");
        }
        Category category = new Category();
        category.setTitle(title);
        category.setDescription(form.description().trim());
        category.setImageUrl(storage.store(image));
        try {
            return CategoryDto.from(repository.saveAndFlush(category));
        } catch (DataIntegrityViolationException e) {
            storage.deleteQuietly(List.of(category.getImageUrl()));
            throw new ApiException(HttpStatus.CONFLICT, TITLE_IN_USE);
        }
    }

    /** Its products stay published, without a category. */
    @DeleteMapping("/admin/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        Category category = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Esa categoría ya no existe."));
        products.clearCategory(id);
        repository.delete(category);
        repository.flush();
        if (category.getImageUrl() != null && category.getImageUrl().startsWith("/uploads/")) {
            storage.deleteQuietly(List.of(category.getImageUrl()));
        }
    }
}
