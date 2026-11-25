package com.rumbo.api.product;

import com.rumbo.api.category.CategoryRepository;
import com.rumbo.api.common.ApiException;
import com.rumbo.api.feature.FeatureRepository;
import com.rumbo.api.product.ProductDtos.*;
import com.rumbo.api.reservation.ReservationRepository;
import com.rumbo.api.review.ReviewRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductService {
    private static final String NOT_FOUND = "No encontramos ese alojamiento.";
    private static final String NAME_IN_USE = "El nombre ya está en uso. Elige otro nombre para el producto.";
    private final ProductRepository repository;
    private final CategoryRepository categories;
    private final FeatureRepository features;
    private final ImageStorage storage;
    private final ReviewRepository reviews;
    private final ReservationRepository reservations;

    public ProductService(ProductRepository repository, CategoryRepository categories, FeatureRepository features,
                          ImageStorage storage, ReviewRepository reviews, ReservationRepository reservations) {
        this.repository = repository;
        this.categories = categories;
        this.features = features;
        this.storage = storage;
        this.reviews = reviews;
        this.reservations = reservations;
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
        return page(ids, page, size, catalogTotal);
    }

    /**
     * Text (name, city, category, description; accents and case ignored), category and date filters.
     * Every word must match somewhere; a match in the name weighs more than one in the description.
     * shortcut: matches in memory over a light projection, fine for a few thousand products; move to full-text search if it grows.
     */
    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> search(String q, LocalDate start, LocalDate end, Collection<Long> categoryIds,
                                               int page, int size) {
        if ((start == null) != (end == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Elige la fecha de llegada y la de salida.");
        }
        if (start != null && start.isBefore(LocalDate.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La fecha de llegada no puede ser anterior a hoy.");
        }
        if (start != null && !end.isAfter(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La salida debe ser al menos un día después de la llegada.");
        }
        List<String> words = Arrays.stream(fold(q).split("\\s+")).filter(w -> !w.isEmpty()).toList();
        Set<Long> booked = start == null ? Set.of() : reservations.findBookedProductIds(start, end);
        record Hit(Long id, String name, int score) {
        }
        List<SearchRow> rows = repository.findSearchRows();
        List<Long> ids = rows.stream()
                .filter(r -> categoryIds.isEmpty() || categoryIds.contains(r.categoryId()))
                .filter(r -> !booked.contains(r.id()))
                .map(r -> new Hit(r.id(), r.name(), score(r, words)))
                .filter(h -> h.score() > 0 || words.isEmpty())
                .sorted(Comparator.comparingInt(Hit::score).reversed().thenComparing(Hit::name))
                .map(Hit::id).toList();
        return page(ids, page, size, rows.size());
    }

    /** Up to 8 product names, cities and categories that contain what the visitor typed, cities first. */
    @Transactional(readOnly = true)
    public List<String> suggestions(String q) {
        String typed = fold(q).trim();
        if (typed.length() < 2) {
            return List.of();
        }
        var rows = repository.findSearchRows();
        return java.util.stream.Stream.of(
                        rows.stream().map(SearchRow::city),
                        rows.stream().map(SearchRow::category),
                        rows.stream().map(SearchRow::name))
                .flatMap(Function.identity())
                .filter(v -> v != null && fold(v).contains(typed))
                .distinct().limit(8).toList();
    }

    @Transactional(readOnly = true)
    public ProductDetail detail(Long id) {
        return ProductDetail.from(find(id), rating(id));
    }

    /** Booked stays from today up to one year ahead, for the availability calendar. */
    @Transactional(readOnly = true)
    public List<BookedRange> availability(Long id) {
        requireExists(id);
        LocalDate today = LocalDate.now();
        return reservations.findOverlapping(id, today, today.plusYears(1)).stream()
                .map(r -> new BookedRange(r.getStartDate(), r.getEndDate())).toList();
    }

    /** 404 with the usual message when the product is gone. */
    public void requireExists(Long id) {
        if (!repository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, NOT_FOUND);
        }
    }

    /** Average (one decimal) and count of reviews per product; products without reviews are left out. */
    private Map<Long, Rating> ratings(Collection<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        return reviews.ratingsOf(productIds).stream().collect(Collectors.toMap(r -> (Long) r[0],
                r -> new Rating(Math.round(((Number) r[1]).doubleValue() * 10) / 10.0, (Long) r[2])));
    }

    public Rating rating(Long productId) {
        return ratings(List.of(productId)).getOrDefault(productId, Rating.NONE);
    }

    /** Cards for these products, in the same order as the ids. */
    @Transactional(readOnly = true)
    public List<ProductSummary> summaries(List<Long> ids) {
        Map<Long, Product> byId = repository.findByIdIn(ids).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        Map<Long, Rating> rating = ratings(ids);
        return ids.stream().filter(byId::containsKey)
                .map(id -> ProductSummary.from(byId.get(id), rating.getOrDefault(id, Rating.NONE))).toList();
    }

    private PageResponse<ProductSummary> page(List<Long> ids, int page, int size, long catalogTotal) {
        int from = (int) Math.min((long) page * size, ids.size());
        List<ProductSummary> content = summaries(ids.subList(from, Math.min(from + size, ids.size())));
        int totalPages = (int) Math.ceil(ids.size() / (double) size);
        return new PageResponse<>(content, page, size, ids.size(), totalPages, catalogTotal);
    }

    private static int score(SearchRow r, List<String> words) {
        if (words.isEmpty()) {
            return 0;
        }
        String name = fold(r.name()), city = fold(r.city()), category = fold(r.category()), description = fold(r.description());
        int total = 0;
        for (String w : words) {
            int s = (name.contains(w) ? 4 : 0) + (city.contains(w) ? 3 : 0)
                    + (category.contains(w) ? 2 : 0) + (description.contains(w) ? 1 : 0);
            if (s == 0) {
                return 0;
            }
            total += s;
        }
        return total;
    }

    /** Lower case without accents, so "medellin" finds "Medellín". */
    static String fold(String s) {
        return s == null ? "" : Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
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
        repository.deleteFavoritesOf(id); // reviews and reservations go with the product (ON DELETE CASCADE)
        repository.deleteById(id);
    }

    private Product find(Long id) {
        return repository.findWithImagesById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, NOT_FOUND));
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
        List<String> titles = form.policyTitles() == null ? List.of() : form.policyTitles();
        List<String> texts = form.policyDescriptions() == null ? List.of() : form.policyDescriptions();
        product.getPolicies().clear();
        for (int i = 0; i < Math.max(titles.size(), texts.size()); i++) {
            String title = i < titles.size() && titles.get(i) != null ? titles.get(i).trim() : "";
            String text = i < texts.size() && texts.get(i) != null ? texts.get(i).trim() : "";
            if (title.isEmpty() != text.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Cada política necesita un título y una descripción.");
            }
            if (!title.isEmpty()) {
                product.addPolicy(title, text);
            }
        }
    }

    private ProductDetail saveWithImages(Product product, List<MultipartFile> files) {
        List<String> stored = files.stream().map(storage::store).toList();
        stored.forEach(product::addImage);
        try {
            Product saved = repository.saveAndFlush(product);
            return ProductDetail.from(saved, rating(saved.getId()));
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
