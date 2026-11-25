package com.rumbo.api.config;

import com.rumbo.api.category.CategoryRepository;
import com.rumbo.api.feature.FeatureRepository;
import com.rumbo.api.product.ProductRepository;
import com.rumbo.api.reservation.Reservation;
import com.rumbo.api.reservation.ReservationRepository;
import com.rumbo.api.review.Review;
import com.rumbo.api.review.ReviewRepository;
import com.rumbo.api.user.User;
import com.rumbo.api.user.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Loads data.sql only into an empty database, so products deleted by the admin never come back on restart.
 * features.sql and policies.sql run once, when their table is empty (also on databases created before them).
 * Demo stays and reviews (dates relative to today) are added once, when there are no reservations.
 */
@Component
@ConditionalOnProperty(name = "app.seed", havingValue = "true", matchIfMissing = true)
public class SeedRunner implements ApplicationRunner {
    static final String DEMO_PASSWORD = "Viajes2026";
    private static final String[][] DEMO_USERS = {
            {"Valentina", "Gómez", "valentina.gomez@correo.test"},
            {"Andrés", "Ruiz", "andres.ruiz@correo.test"},
            {"Camila", "Ortiz", "camila.ortiz@correo.test"},
    };
    private static final int[] RATINGS = {5, 4, 5, 3, 4, 5, 4, 5, 2, 4, 5, 4};
    private static final String[] COMMENTS = {
            "Todo impecable y el anfitrión muy atento. Volveríamos sin pensarlo.",
            "Muy buena ubicación. La ducha tardaba en calentar, pero nada grave.",
            "La vista al amanecer vale cada peso.",
            null,
            "Cómodo y limpio. El camino de llegada es destapado, mejor en camioneta.",
            "El desayuno campesino fue lo mejor del viaje.",
            null,
            "Perfecto para desconectarse. No hay señal, y se agradece.",
            "Las fotos se ven mejor que el lugar. El ruido de la vía no deja dormir.",
            "Buena relación calidad-precio.",
            "Nos recibieron con café de la finca. Un lugar con alma.",
            null,
    };

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final FeatureRepository features;
    private final UserRepository users;
    private final ReservationRepository reservations;
    private final ReviewRepository reviews;
    private final PasswordEncoder encoder;
    private final DataSource dataSource;

    public SeedRunner(CategoryRepository categories, ProductRepository products, FeatureRepository features,
                      UserRepository users, ReservationRepository reservations, ReviewRepository reviews,
                      PasswordEncoder encoder, DataSource dataSource) {
        this.categories = categories;
        this.products = products;
        this.features = features;
        this.users = users;
        this.reservations = reservations;
        this.reviews = reviews;
        this.encoder = encoder;
        this.dataSource = dataSource;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (categories.count() == 0 && products.count() == 0) {
            sql("data.sql");
        }
        if (features.count() == 0) {
            sql("features.sql");
        }
        if (products.countPolicies() == 0) {
            sql("policies.sql");
        }
        List<Long> ids = products.findAllIds();
        if (reservations.count() == 0 && ids.size() >= 5) {
            seedStays(ids);
        }
    }

    private void sql(String file) {
        new ResourceDatabasePopulator(new ClassPathResource(file)).execute(dataSource);
    }

    /** Past stays with reviews, plus Valentina's unrated past stay and upcoming stays that block dates. */
    private void seedStays(List<Long> ids) {
        LocalDate today = LocalDate.now();
        List<User> demo = java.util.Arrays.stream(DEMO_USERS).map(this::demoUser).toList();
        for (int i = 0; i < RATINGS.length; i++) {
            LocalDate start = today.minusDays(90 - i * 6L);
            Reservation stay = stay(demo.get(i % demo.size()), ids.get(i % ids.size()), start, start.plusDays(2 + i % 3));
            Review review = new Review();
            review.setUser(stay.getUser());
            review.setProduct(stay.getProduct());
            review.setReservation(stay);
            review.setRating(RATINGS[i]);
            review.setComment(COMMENTS[i]);
            review.setCreatedAt(stay.getEndDate().atTime(12, 0).atZone(ZoneId.systemDefault()).toInstant());
            reviews.save(review);
        }
        User valentina = demo.getFirst();
        stay(valentina, ids.getFirst(), today.minusDays(10), today.minusDays(7));
        stay(valentina, ids.getFirst(), today.plusDays(5), today.plusDays(9));
        stay(demo.get(1), ids.getFirst(), today.plusDays(20), today.plusDays(23));
        stay(demo.get(2), ids.get(1), today.plusDays(2), today.plusDays(6));
        stay(demo.get(1), ids.get(4), today.plusDays(10), today.plusDays(14));
    }

    private User demoUser(String[] data) {
        return users.findByEmail(data[2]).orElseGet(() -> {
            User user = new User();
            user.setFirstName(data[0]);
            user.setLastName(data[1]);
            user.setEmail(data[2]);
            user.setPasswordHash(encoder.encode(DEMO_PASSWORD));
            return users.save(user);
        });
    }

    private Reservation stay(User user, Long productId, LocalDate start, LocalDate end) {
        Reservation r = new Reservation();
        r.setUser(user);
        r.setProduct(products.getReferenceById(productId));
        r.setStartDate(start);
        r.setEndDate(end);
        return reservations.save(r);
    }
}
