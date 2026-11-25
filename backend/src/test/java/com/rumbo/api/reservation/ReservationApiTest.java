package com.rumbo.api.reservation;

import com.rumbo.api.product.Product;
import com.rumbo.api.product.ProductRepository;
import com.rumbo.api.review.Review;
import com.rumbo.api.review.ReviewRepository;
import com.rumbo.api.user.MailService;
import com.rumbo.api.user.MailService.BookingMail;
import com.rumbo.api.user.User;
import com.rumbo.api.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Sprint 4: booking, overlap rule, history and booking email. */
@SpringBootTest
@AutoConfigureMockMvc
class ReservationApiTest {
    static final LocalDate TODAY = LocalDate.now();

    @Autowired
    MockMvc mvc;
    @Autowired
    ProductRepository products;
    @Autowired
    UserRepository users;
    @Autowired
    ReservationRepository reservations;
    @Autowired
    ReviewRepository reviews;
    @MockitoBean
    MailService mail;

    Product cabin;
    User ana;

    @AfterEach
    void clean() {
        reviews.deleteAll();
        reservations.deleteAll();
        users.deleteAll();
        products.deleteAll();
    }

    @BeforeEach
    void seed() {
        clean();
        cabin = new Product();
        cabin.setName("Cabaña del Río");
        cabin.setDescription("Vista al río");
        cabin.setCity("Salento");
        cabin.setPricePerNight(new BigDecimal("250000"));
        cabin.setWhatsappPhone("573001234567");
        cabin.addImage("https://example.com/cabana.jpg");
        products.save(cabin);
        ana = new User();
        ana.setFirstName("Ana");
        ana.setLastName("Pérez");
        ana.setEmail("ana@correo.test");
        ana.setPasswordHash("x");
        users.save(ana);
    }

    private RequestPostProcessor asAna() {
        return authentication(new UsernamePasswordAuthenticationToken(ana.getId(), null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    private String body(LocalDate start, LocalDate end, String extra) {
        return "{\"productId\":" + cabin.getId() + ",\"startDate\":\"" + start + "\",\"endDate\":\"" + end + "\"" + extra + "}";
    }

    @Test
    void bookingNeedsLoginSavesOptionalDataAndSendsTheEmail() throws Exception {
        String json = body(TODAY.plusDays(3), TODAY.plusDays(5),
                ",\"guests\":2,\"phone\":\"300 123 4567\",\"arrivalTime\":\"15:30\",\"notes\":\"Llegamos con un perro pequeño\"");
        mvc.perform(post("/api/reservations").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.product.name").value("Cabaña del Río"))
                .andExpect(jsonPath("$.nights").value(2))
                .andExpect(jsonPath("$.total").value(500000))
                .andExpect(jsonPath("$.guests").value(2))
                .andExpect(jsonPath("$.arrivalTime").value("15:30:00"))
                .andExpect(jsonPath("$.notes").value("Llegamos con un perro pequeño"))
                .andExpect(jsonPath("$.status").value("PROXIMA"));

        ArgumentCaptor<BookingMail> sent = ArgumentCaptor.forClass(BookingMail.class);
        verify(mail).sendBooking(sent.capture());
        assertThat(sent.getValue().email()).isEqualTo("ana@correo.test");
        assertThat(sent.getValue().productName()).isEqualTo("Cabaña del Río");
        assertThat(sent.getValue().phone()).isEqualTo("573001234567");
        assertThat(sent.getValue().nights()).isEqualTo(2);
    }

    @Test
    void overlappingDatesAreRejectedButTheCheckOutDayIsFree() throws Exception {
        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                .content(body(TODAY.plusDays(10), TODAY.plusDays(14), ""))).andExpect(status().isCreated());

        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(TODAY.plusDays(12), TODAY.plusDays(16), "")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Elige otro rango")));
        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                .content(body(TODAY.plusDays(14), TODAY.plusDays(16), ""))).andExpect(status().isCreated());
        assertThat(reservations.count()).isEqualTo(2);
    }

    @Test
    void invalidDatesAndFieldsGetSpecificMessages() throws Exception {
        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(TODAY.minusDays(1), TODAY.plusDays(2), "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("anterior a hoy")));
        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(TODAY.plusDays(2), TODAY.plusDays(2), "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("al menos un día")));
        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(TODAY.plusDays(1), TODAY.plusDays(40), "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("30 noches")));
        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(TODAY.plusDays(1), TODAY.plusDays(2), ",\"guests\":0,\"phone\":\"abc\"")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.guests").exists())
                .andExpect(jsonPath("$.fields.phone").exists());
        for (String phone : new String[]{"+57 (300) 123-4567 890", "(((((((("}) { // over the column size / no digits
            mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                            .content(body(TODAY.plusDays(1), TODAY.plusDays(2), ",\"phone\":\"" + phone + "\"")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fields.phone").exists());
        }
        mvc.perform(post("/api/reservations").with(asAna()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":999999,\"startDate\":\"" + TODAY.plusDays(1) + "\",\"endDate\":\"" + TODAY.plusDays(2) + "\"}"))
                .andExpect(status().isNotFound());
        verify(mail, never()).sendBooking(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void historyIsNewestFirstWithStatusAndRatingLink() throws Exception {
        Reservation past = stay(TODAY.minusDays(10), TODAY.minusDays(7));
        Reservation rated = stay(TODAY.minusDays(30), TODAY.minusDays(28));
        reviews.save(Review.of(rated, 5, null));
        stay(TODAY.minusDays(1), TODAY.plusDays(1));
        stay(TODAY.plusDays(20), TODAY.plusDays(22));

        mvc.perform(get("/api/reservations/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/reservations/me").with(asAna()))
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].status").value("PROXIMA"))
                .andExpect(jsonPath("$[1].status").value("EN_CURSO"))
                .andExpect(jsonPath("$[2].id").value(past.getId()))
                .andExpect(jsonPath("$[2].status").value("FINALIZADA"))
                .andExpect(jsonPath("$[2].canReview").value(true))
                .andExpect(jsonPath("$[3].canReview").value(false))
                .andExpect(jsonPath("$[0].product.mainImage").value("https://example.com/cabana.jpg"));
    }

    @Test
    void detailShowsTheHostWhatsapp() throws Exception {
        mvc.perform(get("/api/products/" + cabin.getId())).andExpect(jsonPath("$.whatsappPhone").value("573001234567"));
    }

    private Reservation stay(LocalDate start, LocalDate end) {
        Reservation r = new Reservation();
        r.setUser(ana);
        r.setProduct(cabin);
        r.setStartDate(start);
        r.setEndDate(end);
        return reservations.save(r);
    }
}
