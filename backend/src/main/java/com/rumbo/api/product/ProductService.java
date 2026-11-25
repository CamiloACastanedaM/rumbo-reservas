package com.rumbo.api.product;

import com.rumbo.api.common.ApiException;
import com.rumbo.api.product.ProductDtos.*;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductService {
    private final ProductRepository repository;
    private final ImageStorage storage;

    public ProductService(ProductRepository repository, ImageStorage storage) {
        this.repository = repository;
        this.storage = storage;
    }

    /**
     * Random order that stays stable for one seed, so paging never repeats or skips a product.
     * shortcut: shuffles every id in memory, fine for a catalog of a few thousand rows; move to a seeded SQL order if it grows.
     */
    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> randomPage(long seed, int page, int size) {
        List<Long> ids = new ArrayList<>(repository.findAllIds());
        ids.sort(Comparator.naturalOrder());
        Collections.shuffle(ids, new Random(seed));
        int from = Math.min(page * size, ids.size());
        List<Long> slice = ids.subList(from, Math.min(from + size, ids.size()));
        Map<Long, Product> byId = repository.findByIdIn(slice).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        List<ProductSummary> content = slice.stream().map(byId::get).map(ProductSummary::from).toList();
        int totalPages = (int) Math.ceil(ids.size() / (double) size);
        return new PageResponse<>(content, page, size, ids.size(), totalPages);
    }

    @Transactional(readOnly = true)
    public ProductDetail detail(Long id) {
        return repository.findWithImagesById(id).map(ProductDetail::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No encontramos ese alojamiento."));
    }

    @Transactional(readOnly = true)
    public List<AdminRow> adminList() {
        return repository.findAll(Sort.by("id")).stream().map(p -> new AdminRow(p.getId(), p.getName())).toList();
    }

    @Transactional
    public ProductDetail create(ProductForm form, List<MultipartFile> images) {
        String name = form.name().trim();
        if (repository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "El nombre ya está en uso. Elige otro nombre para el producto.");
        }
        List<MultipartFile> files = images == null ? List.of() : images.stream().filter(f -> !f.isEmpty()).toList();
        if (files.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Agrega al menos una imagen del producto.");
        }
        Product product = new Product();
        product.setName(name);
        product.setDescription(form.description().trim());
        product.setCity(blankToNull(form.city()));
        product.setAddress(blankToNull(form.address()));
        product.setPricePerNight(form.pricePerNight());
        files.forEach(f -> product.addImage(storage.store(f)));
        return ProductDetail.from(repository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Ese producto ya no existe.");
        }
        repository.deleteById(id);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
