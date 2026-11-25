package com.rumbo.api.category;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByTitleIgnoreCase(String title);
}
