package com.rumbo.api.product;

import com.rumbo.api.category.Category;
import com.rumbo.api.feature.Feature;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(length = 80)
    private String city;

    @Column(length = 200)
    private String address;

    @Column(name = "price_per_night", precision = 12, scale = 2)
    private BigDecimal pricePerNight;

    @Column(name = "whatsapp_phone", length = 20)
    private String whatsappPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<ProductImage> images = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "product_features",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "feature_id"))
    private Set<Feature> features = new HashSet<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Policy> policies = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public void addImage(String url) {
        ProductImage image = new ProductImage();
        image.setProduct(this);
        image.setUrl(url);
        image.setPosition(images.size());
        images.add(image);
    }

    public void addPolicy(String title, String description) {
        Policy policy = new Policy();
        policy.setProduct(this);
        policy.setTitle(title);
        policy.setDescription(description);
        policies.add(policy);
    }
}
