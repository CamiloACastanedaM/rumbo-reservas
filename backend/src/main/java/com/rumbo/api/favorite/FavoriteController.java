package com.rumbo.api.favorite;

import com.rumbo.api.common.ApiException;
import com.rumbo.api.product.ProductDtos.ProductSummary;
import com.rumbo.api.product.ProductRepository;
import com.rumbo.api.product.ProductService;
import com.rumbo.api.user.User;
import com.rumbo.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The signed-in user's favorites. Adding or removing twice is harmless. */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    private final UserRepository users;
    private final ProductRepository products;
    private final ProductService productService;

    public FavoriteController(UserRepository users, ProductRepository products, ProductService productService) {
        this.users = users;
        this.products = products;
        this.productService = productService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<ProductSummary> list(@AuthenticationPrincipal Long userId) {
        return productService.summaries(products.findFavoriteIds(userId));
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void add(@AuthenticationPrincipal Long userId, @PathVariable Long productId) {
        productService.requireExists(productId);
        user(userId).getFavorites().add(products.getReferenceById(productId));
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void remove(@AuthenticationPrincipal Long userId, @PathVariable Long productId) {
        user(userId).getFavorites().removeIf(p -> p.getId().equals(productId));
    }

    private User user(Long id) {
        return users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Inicia sesión para continuar."));
    }
}
