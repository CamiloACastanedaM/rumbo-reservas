package com.rumbo.api.product;

import com.rumbo.api.category.CategoryRepository;
import com.rumbo.api.common.ApiException;
import com.rumbo.api.feature.FeatureRepository;
import com.rumbo.api.product.ProductDtos.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductService {
    private static final String NAME_IN_USE = "El nombre ya está en uso. Elige otro nombre para el producto.";
    private final ProductRepository repository;
    private final CategoryRepository categories;
    private final FeatureRepository features;
    private final ImageStorage storage;

    public ProductService(ProductRepository repository, CategoryRepository categories, FeatureRepository features,
                          ImageStorage storage) {
        this.repository = repository;
        this.categories = categories;
        this.features = features;
        this.storage = storage;
    }

    /**
     * Random order that stays stable for one seed, so paging never repeats or skips a product.
     * shortcut: shuffles every id in memory, fine for a catalog of a few thousand rows; move to a seeded SQL order if it grows.
     */
    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> randomPage(long seed, int page, int size, Collection<Long> categoryIds) {
        List<Long> ids = new ArrayList<>(categoryIds.isEmpty() ? repository.findAllIds()
                : repository.findIdsByCategoryIds(categoryIds)); // mutable copy for shuffle
        long catalogTotal = categoryIds.isEmpty() ? ids.size() : repository.count();
        Collections.shuffle(ids, new Random(seed));
        int from = Math.min(page * size, ids.size());
        List<Long> slice = ids.subList(from, Math.min(from + size, ids.size()));
        Map<Long, Product> byId = repository.findByIdIn(slice).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        List<ProductSummary> content = slice.stream().map(byId::get).map(ProductSummary::from).toList();
        int totalPages = (int) Math.ceil(ids.size() / (double) size);
        return new PageResponse<>(content, page, size, ids.size(), totalPages, catalogTotal);
    }

    @Transactional(readOnly = true)
    public ProductDetail detail(Long id) {
        return ProductDetail.from(find(id));
    }

    @Transactional(readOnly = true)
    public List<AdminRow> adminList() {
        return repository.findAdminRows();
    }

    @Transactional
    public ProductDetail create(ProductForm form, List<MultipartFile> images) {
        String name = form.name().trim();
        if (repository.existsByNameIgnoreCase(name)) {
            throw new ApiException(HttpStatus.CONFLICT, NAME_IN_USE);
        }
        List<MultipartFile> files = nonEmpty(images);
        if (files.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Agrega al menos una imagen del producto.");
        }
        Product product = new Product();
        apply(product, form);
        return saveWithImages(product, files);
    }

    @Transactional
    public ProductDetail update(Long id, ProductForm form, List<MultipartFile> images) {
        Product product = find(id);
        if (repository.existsByNameIgnoreCaseAndIdNot(form.name().trim(), id)) {
            throw new ApiException(HttpStatus.CONFLICT, NAME_IN_USE);
        }
        List<String> keep = form.keepImages() == null ? List.of() : form.keepImages();
        List<MultipartFile> files = nonEmpty(images);
        if (keep.isEmpty() && files.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El producto necesita al menos una imagen.");
        }
        apply(product, form);
        // Kept photos stay in the order the admin left them; removed ones are deleted (orphanRemoval).
        Set<String> current = product.getImages().stream().map(ProductImage::getUrl).collect(Collectors.toSet());
        List<String> kept = keep.stream().filter(current::contains).distinct().toList();
        List<String> removed = current.stream().filter(url -> !kept.contains(url) && url.startsWith("/uploads/")).toList();
        product.getImages().clear();
        kept.forEach(product::addImage);
        ProductDetail saved = saveWithImages(product, files);
        storage.deleteQuietly(removed); // only after the save worked, so a failed edit keeps its photos
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Ese producto ya no existe.");
        }
        repository.deleteById(id);
    }

    private Product find(Long id) {
        return repository.findWithImagesById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No encontramos ese alojamiento."));
    }

    private void apply(Product product, ProductForm form) {
        product.setName(form.name().trim());
        product.setDescription(form.description().trim());
        product.setCity(blankToNull(form.city()));
        product.setAddress(blankToNull(form.address()));
        product.setPricePerNight(form.pricePerNight());
        product.setCategory(form.categoryId() == null ? null : categories.findById(form.categoryId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Esa categoría ya no existe. Elige otra.")));
        List<Long> featureIds = form.featureIds() == null ? List.of() : form.featureIds();
        var found = features.findAllById(featureIds);
        if (found.size() != new HashSet<>(featureIds).size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Alguna característica ya no existe. Recarga la página.");
        }
        product.setFeatures(new HashSet<>(found));
    }

    private ProductDetail saveWithImages(Product product, List<MultipartFile> files) {
        List<String> stored = files.stream().map(storage::store).toList();
        stored.forEach(product::addImage);
        try {
            return ProductDetail.from(repository.saveAndFlush(product));
        } catch (DataIntegrityViolationException e) {
            // The unique index also ignores accents (MySQL collation), and catches concurrent saves.
            storage.deleteQuietly(stored);
            throw new ApiException(HttpStatus.CONFLICT, NAME_IN_USE);
        }
    }

    private static List<MultipartFile> nonEmpty(List<MultipartFile> images) {
        return images == null ? List.of() : images.stream().filter(f -> !f.isEmpty()).toList();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
