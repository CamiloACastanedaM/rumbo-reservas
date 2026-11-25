package com.rumbo.api.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {
    private final SecretKey key;
    private final Duration ttl;

    public JwtService(@Value("${app.jwt.secret:}") String secret, @Value("${app.jwt.ttl:PT12H}") Duration ttl) {
        // Without a configured secret, each start signs with a fresh random key (sessions end on restart).
        this.key = secret.length() >= 32 ? Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))
                : Jwts.SIG.HS256.key().build();
        this.ttl = ttl;
    }

    public String issue(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder().subject(userId.toString())
                .issuedAt(Date.from(now)).expiration(Date.from(now.plus(ttl)))
                .signWith(key).compact();
    }

    /** User id of a valid, unexpired token. */
    public Optional<Long> userId(String token) {
        try {
            return Optional.of(Long.valueOf(Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload().getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
