package com.rumbo.api.product;

import com.rumbo.api.category.Category;
import com.rumbo.api.category.CategoryRepository;
import com.rumbo.api.reservation.Reservation;
import com.rumbo.api.reservation.ReservationRepository;
import com.rumbo.api.review.ReviewRepository;
import com.rumbo.api.user.User;
import com.rumbo.api.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Sprint 3: search, availability, favorites, policies, reviews and category delete. */
@SpringBootTest
@AutoConfigureMockMvc
class SprintThreeApiTest {
    static final LocalDate TODAY = LocalDate.now();

    @Autowired
    MockMvc mvc;
    @Autowired
    ProductRepository products;
    @Autowired
    CategoryRepository categories;
    @Autowired
    UserRepository users;
    @Autowired
    ReservationRepository reservations;
    @Autowired
    ReviewRepository reviews;

    Product cabin;
    Product dome;
    Category glamping;
    User ana;

    /** Also after each test, so the other test classes start without stays, reviews or favorites. */
    @AfterEach
    void clean() {
        reviews.deleteAll();
        reservations.deleteAll();
        users.deleteAll(); // removes their favorites rows too
        products.deleteAll();
        categories.deleteAll();
    }

    @BeforeEach
    void seed() {
        clean();
        glamping = new Category();
        glamping.setTitle("Glamping");
        categories.save(glamping);
        cabin = product("Cabaña del Río", "Medellín", null);
        dome = product("Domo Estrellas", "Villa de Leyva", glamping);
        ana = new User();
        ana.setFirstName("Ana");
        ana.setLastName("Pérez");
        ana.setEmail("ana@correo.test");
        ana.setPasswordHash("x");
        users.save(ana);
    }

    private Product product(String name, String city, Category category) {
        Product p = new Product();
        p.setName(name);
        p.setDescription("Alojamiento con vista al río");
        p.setCity(city);
        p.setCategory(category);
        p.addImage("https://example.com/" + name.length() + ".jpg");
        p.addPolicy("Normas de la casa", "Sin fiestas.");
        return products.save(p);
    }

    private Reservation stay(Product product, LocalDate start, LocalDate end) {
        Reservation r = new Reservation();
        r.setUser(ana);
        r.setProduct(product);
        r.setStartDate(start);
        r.setEndDate(end);
        return reservations.save(r);
    }

    private RequestPostProcessor asAna() {
        return authentication(new UsernamePasswordAuthenticationToken(ana.getId(), null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    @Test
    void searchMatchesTextWithoutAccentsCategoriesAndFreeDates() throws Exception {
        mvc.perform(get("/api/products/search").param("q", "medellin"))
                .andExpect(jsonPath("$.content[*].name", contains("Cabaña del Río")))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.catalogTotal").value(2));
        mvc.perform(get("/api/products/search").param("q", "glamping"))
                .andExpect(jsonPath("$.content[*].name", contains("Domo Estrellas")));
        mvc.perform(get("/api/products/search").param("q", "rio").param("categoryIds", glamping.getId().toString()))
                .andExpect(jsonPath("$.content[*].name", contains("Domo Estrellas")));

        // A stay [+3, +6) blocks a search that overlaps it; the check-out day is free again.
        stay(cabin, TODAY.plusDays(3), TODAY.plusDays(6));
        mvc.perform(get("/api/products/search").param("start", TODAY.plusDays(5).toString()).param("end", TODAY.plusDays(8).toString()))
                .andExpect(jsonPath("$.content[*].name", contains("Domo Estrellas")));
        mvc.perform(get("/api/products/search").param("start", TODAY.plusDays(6).toString()).param("end", TODAY.plusDays(8).toString()))
                .andExpect(jsonPath("$.totalElements").value(2));

        mvc.perform(get("/api/products/search").param("start", TODAY.minusDays(1).toString()).param("end", TODAY.toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/products/search").param("start", TODAY.plusDays(2).toString()).param("end", TODAY.plusDays(2).toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/products/search").param("start", "no-es-fecha"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void suggestionsAndAvailability() throws Exception {
        mvc.perform(get("/api/products/suggestions").param("q", "vill"))
                .andExpect(jsonPath("$", contains("Villa de Leyva")));
        mvc.perform(get("/api/products/suggestions").param("q", "v")).andExpect(jsonPath("$.length()").value(0));

        stay(cabin, TODAY.minusDays(9), TODAY.minusDays(4)); // past: not shown
        stay(cabin, TODAY.plusDays(3), TODAY.plusDays(6));
        mvc.perform(get("/api/products/" + cabin.getId() + "/availability"))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].start").value(TODAY.plusDays(3).toString()))
                .andExpect(jsonPath("$[0].end").value(TODAY.plusDays(6).toString()));
        mvc.perform(get("/api/products/999999/availability")).andExpect(status().isNotFound());
    }

    @Test
    void favoritesNeedLoginAndCanBeToggled() throws Exception {
        mvc.perform(get("/api/favorites")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/favorites/" + dome.getId()).with(asAna())).andExpect(status().isNoContent());
        mvc.perform(post("/api/favorites/" + dome.getId()).with(asAna())).andExpect(status().isNoContent());
        mvc.perform(post("/api/favorites/999999").with(asAna())).andExpect(status().isNotFound());
        mvc.perform(get("/api/favorites").with(asAna()))
                .andExpect(jsonPath("$[*].name", contains("Domo Estrellas")));
        mvc.perform(delete("/api/favorites/" + dome.getId()).with(asAna())).andExpect(status().isNoContent());
        mvc.perform(get("/api/favorites").with(asAna())).andExpect(jsonPath("$.length()").value(0));

        // A favorite does not block deleting the product.
        mvc.perform(post("/api/favorites/" + cabin.getId()).with(asAna())).andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/products/" + cabin.getId())
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN")))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/favorites").with(asAna())).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void onlyAFinishedStayCanBeRatedOnce() throws Exception {
        String body = "{\"rating\":4,\"comment\":\"Muy lindo\"}";
        mvc.perform(post("/api/products/" + dome.getId() + "/reviews").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        stay(dome, TODAY.plusDays(1), TODAY.plusDays(3)); // upcoming: not yet
        mvc.perform(post("/api/products/" + dome.getId() + "/reviews").with(asAna())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        stay(dome, TODAY.minusDays(5), TODAY.minusDays(2));
        mvc.perform(get("/api/products/" + dome.getId() + "/reviews").with(asAna()))
                .andExpect(jsonPath("$.canReview").value(true));
        mvc.perform(post("/api/products/" + dome.getId() + "/reviews").with(asAna())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":6}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.rating").exists());
        mvc.perform(post("/api/products/" + dome.getId() + "/reviews").with(asAna())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating.average").value(4.0))
                .andExpect(jsonPath("$.rating.count").value(1))
                .andExpect(jsonPath("$.reviews[0].userName").value("Ana P."))
                .andExpect(jsonPath("$.reviews[0].comment").value("Muy lindo"))
                .andExpect(jsonPath("$.canReview").value(false));
        mvc.perform(post("/api/products/" + dome.getId() + "/reviews").with(asAna())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/products/" + dome.getId())).andExpect(jsonPath("$.rating.count").value(1));
        mvc.perform(get("/api/products/search").param("q", "domo")).andExpect(jsonPath("$.content[0].rating.average").value(4.0));
        mvc.perform(get("/api/products/" + dome.getId() + "/reviews")).andExpect(jsonPath("$.canReview").value(false));
    }

    @Test
    void detailShowsPolicies() throws Exception {
        mvc.perform(get("/api/products/" + cabin.getId()))
                .andExpect(jsonPath("$.policies[0].title").value("Normas de la casa"))
                .andExpect(jsonPath("$.policies[0].description").value("Sin fiestas."));
    }

    @Test
    void deletingACategoryKeepsItsProductsWithoutCategory() throws Exception {
        var admin = org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN");
        mvc.perform(delete("/api/admin/categories/" + glamping.getId())).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/categories/" + glamping.getId()).with(asAna())).andExpect(status().isForbidden());
        mvc.perform(delete("/api/admin/categories/" + glamping.getId()).with(admin)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/categories/" + glamping.getId()).with(admin)).andExpect(status().isNotFound());
        mvc.perform(get("/api/products/" + dome.getId())).andExpect(status().isOk()).andExpect(jsonPath("$.category").doesNotExist());
        mvc.perform(get("/api/categories")).andExpect(jsonPath("$[*].title", org.hamcrest.Matchers.not(hasItem("Glamping"))));
    }
}
