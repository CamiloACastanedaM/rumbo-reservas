package com.rumbo.api.config;

import com.rumbo.api.category.CategoryRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/** Loads data.sql only into an empty database, so products deleted by the admin never come back on restart. */
@Component
@ConditionalOnProperty(name = "app.seed", havingValue = "true", matchIfMissing = true)
public class SeedRunner implements ApplicationRunner {
    private final CategoryRepository categories;
    private final com.rumbo.api.product.ProductRepository products;
    private final DataSource dataSource;

    public SeedRunner(CategoryRepository categories, com.rumbo.api.product.ProductRepository products, DataSource dataSource) {
        this.categories = categories;
        this.products = products;
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (categories.count() == 0 && products.count() == 0) {
            new ResourceDatabasePopulator(new ClassPathResource("data.sql")).execute(dataSource);
        }
    }
}
