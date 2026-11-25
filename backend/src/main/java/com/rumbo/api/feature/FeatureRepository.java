package com.rumbo.api.feature;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FeatureRepository extends JpaRepository<Feature, Long> {
    List<Feature> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Modifying
    @Query(value = "delete from product_features where feature_id = :id", nativeQuery = true)
    void unlinkFromProducts(Long id);
}
