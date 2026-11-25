package com.rumbo.api.product;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProductApiTest {
    @Autowired
    MockMvc mvc;
    @Autowired
    ProductRepository repository;
    @Autowired
    ProductService service;

    @BeforeEach
    void seed() {
        repository.deleteAll();
        for (int i = 1; i <= 23; i++) {
            Product p = new Product();
            p.setName("Cabaña " + i);
            p.setDescription("Descripción " + i);
            p.addImage("https://example.com/" + i + ".jpg");
            repository.save(p);
        }
    }

    @Test
    void randomPagesCoverEveryProductOnceAndKeepOrderPerSeed() {
        List<Long> seen = new ArrayList<>();
        var first = service.randomPage(42, 0, 10);
        assertThat(first.totalPages()).isEqualTo(3);
        for (int page = 0; page < first.totalPages(); page++) {
            var content = service.randomPage(42, page, 10).content();
            assertThat(content.size()).isLessThanOrEqualTo(10);
            content.forEach(p -> seen.add(p.id()));
        }
        assertThat(seen).hasSize(23);
        assertThat(new HashSet<>(seen)).hasSize(23);
        assertThat(service.randomPage(42, 0, 10).content()).isEqualTo(first.content());
        assertThat(service.randomPage(7, 0, 10).content()).isNotEqualTo(first.content());
    }

    @Test
    void createsProductWithImagesAndRejectsDuplicateName() throws Exception {
        var image = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[]{1, 2, 3});
        mvc.perform(multipart("/api/admin/products").file(image)
                        .param("name", "Glamping Nuevo").param("description", "Vista al valle"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.images[0]").value(containsString("/uploads/")));

        mvc.perform(multipart("/api/admin/products").file(image)
                        .param("name", "glamping nuevo").param("description", "Otra"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("nombre ya está en uso")));
    }

    @Test
    void createRequiresNameDescriptionAndImage() throws Exception {
        mvc.perform(multipart("/api/admin/products").param("name", "").param("description", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.description").exists());

        mvc.perform(multipart("/api/admin/products").param("name", "Sin fotos").param("description", "x"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("imagen")));
    }

    @Test
    void deletesProductAndDetailThen404() throws Exception {
        Long id = repository.findAllIds().getFirst();
        mvc.perform(get("/api/products/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.images.length()").value(1));
        mvc.perform(delete("/api/admin/products/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/products/" + id)).andExpect(status().isNotFound());
        assertThat(repository.existsById(id)).isFalse();
    }

    @Test
    void adminListIsOrderedById() throws Exception {
        mvc.perform(get("/api/admin/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(23))
                .andExpect(jsonPath("$[0].name").value("Cabaña 1"));
    }
}
