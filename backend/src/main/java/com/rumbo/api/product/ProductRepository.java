package com.rumbo.api.product;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByNameIgnoreCase(String name);

    @Query("select p.id from Product p")
    List<Long> findAllIds();

    @EntityGraph(attributePaths = {"images", "category"})
    List<Product> findByIdIn(Collection<Long> ids);

    @EntityGraph(attributePaths = {"images", "category"})
    Optional<Product> findWithImagesById(Long id);
}
