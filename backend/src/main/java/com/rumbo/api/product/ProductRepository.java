package com.rumbo.api.product;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByNameIgnoreCase(String name);

    @Query("select new com.rumbo.api.product.ProductDtos$AdminRow(p.id, p.name, c.title) from Product p left join p.category c order by p.id")
    List<ProductDtos.AdminRow> findAdminRows();

    @Query("select p.id from Product p order by p.id")
    List<Long> findAllIds();

    @Query("select p.id from Product p where p.category.id in :categoryIds order by p.id")
    List<Long> findIdsByCategoryIds(Collection<Long> categoryIds);

    @Query("select new com.rumbo.api.product.ProductDtos$SearchRow(p.id, p.name, p.city, p.description, c.id, c.title) from Product p left join p.category c")
    List<ProductDtos.SearchRow> findSearchRows();

    @Query("select count(x) from Policy x")
    long countPolicies();

    @Modifying
    @Query(value = "delete from favorites where product_id = :productId", nativeQuery = true)
    void deleteFavoritesOf(Long productId);

    @Modifying
    @Query("update Product p set p.category = null where p.category.id = :categoryId")
    int clearCategory(Long categoryId);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @EntityGraph(attributePaths = {"images", "category"})
    List<Product> findByIdIn(Collection<Long> ids);

    // features load lazily: fetching them in the same join would duplicate rows of the images list.
    @EntityGraph(attributePaths = {"images", "category"})
    Optional<Product> findWithImagesById(Long id);
}
