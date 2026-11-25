package com.rumbo.api.product;

import com.rumbo.api.category.CategoryDto;
import com.rumbo.api.feature.Feature;
import com.rumbo.api.feature.FeatureDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public final class ProductDtos {
    private ProductDtos() {
    }

    /** Average stars (0 when there are no reviews yet) and how many reviews. */
    public record Rating(double average, long count) {
        public static final Rating NONE = new Rating(0, 0);
    }

    public record PolicyDto(String title, String description) {
    }

    public record ProductSummary(Long id, String name, String city, BigDecimal pricePerNight,
                                 String mainImage, String category, Rating rating) {
        static ProductSummary from(Product p, Rating rating) {
            String main = p.getImages().isEmpty() ? null : p.getImages().getFirst().getUrl();
            return new ProductSummary(p.getId(), p.getName(), p.getCity(), p.getPricePerNight(), main,
                    p.getCategory() == null ? null : p.getCategory().getTitle(), rating);
        }
    }

    public record ProductDetail(Long id, String name, String description, String city, String address,
                                BigDecimal pricePerNight, CategoryDto category, List<String> images,
                                List<FeatureDto> features, List<PolicyDto> policies, Rating rating) {
        static ProductDetail from(Product p, Rating rating) {
            return new ProductDetail(p.getId(), p.getName(), p.getDescription(), p.getCity(), p.getAddress(),
                    p.getPricePerNight(), p.getCategory() == null ? null : CategoryDto.from(p.getCategory()),
                    p.getImages().stream().map(ProductImage::getUrl).toList(),
                    p.getFeatures().stream().sorted(Comparator.comparing(Feature::getName)).map(FeatureDto::from).toList(),
                    p.getPolicies().stream().map(x -> new PolicyDto(x.getTitle(), x.getDescription())).toList(),
                    rating);
        }
    }

    public record AdminRow(Long id, String name, String category) {
    }

    /** Fields used to match a search, without loading images. */
    public record SearchRow(Long id, String name, String city, String description, Long categoryId, String category) {
    }

    /** A booked stay, [start, end): the end day is the check-out and stays free. */
    public record BookedRange(LocalDate start, LocalDate end) {
    }

    /** totalElements counts the filtered list; catalogTotal counts every product (for "X de Y"). */
    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages,
                                  long catalogTotal) {
    }
}
