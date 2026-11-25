package com.rumbo.api.product;

import com.rumbo.api.product.ProductDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping("/products")
    public PageResponse<ProductSummary> random(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size,
                                               @RequestParam(defaultValue = "0") long seed,
                                               @RequestParam(defaultValue = "") List<Long> categoryIds) {
        return service.randomPage(seed, Math.max(page, 0), Math.clamp(size, 1, 10), categoryIds);
    }

    @GetMapping("/products/{id}")
    public ProductDetail detail(@PathVariable Long id) {
        return service.detail(id);
    }

    @GetMapping("/admin/products")
    public List<AdminRow> adminList() {
        return service.adminList();
    }

    @PostMapping(value = "/admin/products", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDetail create(@Valid @ModelAttribute ProductForm form,
                                @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        return service.create(form, images);
    }

    @PutMapping(value = "/admin/products/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductDetail update(@PathVariable Long id, @Valid @ModelAttribute ProductForm form,
                                @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        return service.update(id, form, images);
    }

    @DeleteMapping("/admin/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
