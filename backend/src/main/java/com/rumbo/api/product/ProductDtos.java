package com.rumbo.api.product;

import com.rumbo.api.category.CategoryDto;

import java.math.BigDecimal;
import java.util.List;

public final class ProductDtos {
    private ProductDtos() {
    }

    public record ProductSummary(Long id, String name, String city, BigDecimal pricePerNight,
                                 String mainImage, String category) {
        static ProductSummary from(Product p) {
            String main = p.getImages().isEmpty() ? null : p.getImages().getFirst().getUrl();
            return new ProductSummary(p.getId(), p.getName(), p.getCity(), p.getPricePerNight(), main,
                    p.getCategory() == null ? null : p.getCategory().getTitle());
        }
    }

    public record ProductDetail(Long id, String name, String description, String city, String address,
                                BigDecimal pricePerNight, CategoryDto category, List<String> images) {
        static ProductDetail from(Product p) {
            return new ProductDetail(p.getId(), p.getName(), p.getDescription(), p.getCity(), p.getAddress(),
                    p.getPricePerNight(), p.getCategory() == null ? null : CategoryDto.from(p.getCategory()),
                    p.getImages().stream().map(ProductImage::getUrl).toList());
        }
    }

    public record AdminRow(Long id, String name) {
    }

    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
    }
}
