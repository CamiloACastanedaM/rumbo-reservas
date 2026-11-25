package com.rumbo.api.product;

import com.jayway.jsonpath.JsonPath;
import com.rumbo.api.category.Category;
import com.rumbo.api.category.CategoryRepository;
import com.rumbo.api.feature.FeatureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Sprint 2: categories, features, product edit and the category filter. */
@SpringBootTest
@AutoConfigureMockMvc
class CatalogAdminApiTest {
    static final RequestPostProcessor ADMIN = user("admin").roles("ADMIN");
    static final MockMultipartFile IMAGE = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[]{1, 2, 3});

    @Autowired
    MockMvc mvc;
    @Autowired
    ProductRepository products;
    @Autowired
    CategoryRepository categories;
    @Autowired
    FeatureRepository features;

    @BeforeEach
    void clean() {
        products.deleteAll();
        categories.deleteAll();
        features.deleteAll();
    }

    private long createFeature(String name, String icon) throws Exception {
        String body = mvc.perform(post("/api/admin/features").with(ADMIN).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\",\"icon\":\"%s\"}".formatted(name, icon)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private Category category(String title) {
        Category c = new Category();
        c.setTitle(title);
        return categories.save(c);
    }

    @Test
    void featuresCanBeCreatedEditedAndDeleted() throws Exception {
        long wifi = createFeature("Wifi", "wifi");
        mvc.perform(post("/api/admin/features").with(ADMIN).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"wifi\",\"icon\":\"wifi\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/admin/features").with(ADMIN).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"icon\":\"<script>\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").exists()).andExpect(jsonPath("$.fields.icon").exists());
        mvc.perform(put("/api/admin/features/" + wifi).with(ADMIN).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Wifi rápido\",\"icon\":\"wifi\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Wifi rápido"));
        mvc.perform(get("/api/features")).andExpect(jsonPath("$[0].name").value("Wifi rápido"));
        mvc.perform(post("/api/features").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"X\",\"icon\":\"x\"}")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/features/" + wifi).with(ADMIN)).andExpect(status().isNoContent());
        mvc.perform(get("/api/features")).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void productGetsCategoryAndFeaturesAndCanBeEdited() throws Exception {
        long pool = createFeature("Piscina", "waves");
        long wifi = createFeature("Wifi", "wifi");
        Category cabins = category("Cabañas");
        Category farms = category("Fincas");

        String body = mvc.perform(multipart("/api/admin/products").file(IMAGE).file(IMAGE).with(ADMIN)
                        .param("name", "Cabaña Roble").param("description", "Bosque")
                        .param("categoryId", cabins.getId().toString())
                        .param("featureIds", String.valueOf(pool), String.valueOf(wifi)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category.title").value("Cabañas"))
                .andExpect(jsonPath("$.features[0].name").value("Piscina"))
                .andExpect(jsonPath("$.features[1].icon").value("wifi"))
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(body, "$.id")).longValue();
        String firstImage = JsonPath.read(body, "$.images[0]");

        // Edit: new category, one feature less, keep only the first photo and add a new one.
        mvc.perform(multipart(HttpMethod.PUT, "/api/admin/products/" + id).file(IMAGE).with(ADMIN)
                        .param("name", "Cabaña Roble Viejo").param("description", "Bosque y río")
                        .param("categoryId", farms.getId().toString())
                        .param("featureIds", String.valueOf(wifi))
                        .param("keepImages", firstImage))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Cabaña Roble Viejo"))
                .andExpect(jsonPath("$.category.title").value("Fincas"))
                .andExpect(jsonPath("$.features.length()").value(1))
                .andExpect(jsonPath("$.images.length()").value(2))
                .andExpect(jsonPath("$.images[0]").value(firstImage));

        // Without any photo left the edit is refused.
        mvc.perform(multipart(HttpMethod.PUT, "/api/admin/products/" + id).with(ADMIN)
                        .param("name", "Cabaña Roble Viejo").param("description", "x"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("al menos una imagen")));

        mvc.perform(get("/api/admin/products").with(ADMIN)).andExpect(jsonPath("$[0].category").value("Fincas"));
        // Deleting a feature in use unlinks it from the product.
        mvc.perform(delete("/api/admin/features/" + wifi).with(ADMIN)).andExpect(status().isNoContent());
        mvc.perform(get("/api/products/" + id)).andExpect(jsonPath("$.features.length()").value(0));
    }

    @Test
    void editRejectsNameOfAnotherProduct() throws Exception {
        for (String name : List.of("Uno", "Dos")) {
            mvc.perform(multipart("/api/admin/products").file(IMAGE).with(ADMIN)
                    .param("name", name).param("description", "d")).andExpect(status().isCreated());
        }
        Long dos = products.findAdminRows().get(1).id();
        mvc.perform(multipart(HttpMethod.PUT, "/api/admin/products/" + dos).file(IMAGE).with(ADMIN)
                        .param("name", "uno").param("description", "d"))
                .andExpect(status().isConflict());
    }

    @Test
    void categoryFilterReturnsFilteredAndCatalogTotals() throws Exception {
        Category cabins = category("Cabañas");
        Category farms = category("Fincas");
        category("Hostales");
        for (int i = 0; i < 5; i++) {
            Product p = new Product();
            p.setName("P" + i);
            p.setDescription("d");
            p.setCategory(i < 2 ? cabins : i < 4 ? farms : null);
            products.save(p);
        }
        mvc.perform(get("/api/products").param("categoryIds", cabins.getId().toString()))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.catalogTotal").value(5))
                .andExpect(jsonPath("$.content[0].category").value("Cabañas"));
        mvc.perform(get("/api/products").param("categoryIds", cabins.getId() + "," + farms.getId()))
                .andExpect(jsonPath("$.totalElements").value(4));
        mvc.perform(get("/api/products")).andExpect(jsonPath("$.totalElements").value(5));
    }

    @Test
    void addsCategoryWithImageAndRejectsDuplicateTitle() throws Exception {
        var image = new MockMultipartFile("image", "c.png", "image/png", new byte[]{1});
        mvc.perform(multipart("/api/admin/categories").file(image).with(ADMIN)
                        .param("title", "Casas en el árbol").param("description", "Dormir entre ramas"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imageUrl").value(containsString("/uploads/")));
        mvc.perform(multipart("/api/admin/categories").file(image).with(ADMIN)
                        .param("title", "casas en el árbol").param("description", "x"))
                .andExpect(status().isConflict());
        mvc.perform(multipart("/api/admin/categories").with(ADMIN).param("title", "").param("description", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.title").exists());
        mvc.perform(multipart("/api/admin/categories").with(ADMIN).param("title", "Sin foto").param("description", "x"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("imagen")));
        mvc.perform(multipart("/api/admin/categories").file(image).param("title", "Anon").param("description", "x"))
                .andExpect(status().isUnauthorized());
    }
}
