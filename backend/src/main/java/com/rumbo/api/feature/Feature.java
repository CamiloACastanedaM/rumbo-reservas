package com.rumbo.api.feature;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "features")
@Getter
@Setter
public class Feature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    /** lucide-react icon key, e.g. "wifi". */
    @Column(nullable = false, length = 40)
    private String icon;
}
