package com.rumbo.api.feature;

public record FeatureDto(Long id, String name, String icon) {
    public static FeatureDto from(Feature f) {
        return new FeatureDto(f.getId(), f.getName(), f.getIcon());
    }
}
