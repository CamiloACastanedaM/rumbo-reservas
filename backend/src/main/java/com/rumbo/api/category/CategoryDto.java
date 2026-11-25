package com.rumbo.api.category;

public record CategoryDto(Long id, String title, String description, String imageUrl) {
    public static CategoryDto from(Category c) {
        return new CategoryDto(c.getId(), c.getTitle(), c.getDescription(), c.getImageUrl());
    }
}
