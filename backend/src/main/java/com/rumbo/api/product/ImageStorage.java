package com.rumbo.api.product;

import com.rumbo.api.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class ImageStorage {
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg", "image/png", ".png", "image/webp", ".webp", "image/avif", ".avif");

    private final Path dir;

    public ImageStorage(@Value("${app.upload-dir}") String uploadDir) {
        this.dir = Path.of(uploadDir).toAbsolutePath();
    }

    public Path dir() {
        return dir;
    }

    /** Removes files saved by {@link #store} when the product they belong to could not be saved. */
    public void deleteQuietly(List<String> publicPaths) {
        for (String path : publicPaths) {
            try {
                Files.deleteIfExists(dir.resolve(path.substring(path.lastIndexOf('/') + 1)));
            } catch (IOException ignored) {
                // best effort: an orphan file is harmless
            }
        }
    }

    /** Saves the file under a random name and returns its public path. */
    public String store(MultipartFile file) {
        String ext = EXTENSIONS.get(file.getContentType());
        if (ext == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Solo se aceptan imágenes JPG, PNG, WebP o AVIF.");
        }
        try {
            Files.createDirectories(dir);
            String name = UUID.randomUUID() + ext;
            file.transferTo(dir.resolve(name));
            return "/uploads/" + name;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "No pudimos guardar la imagen. Intenta de nuevo.");
        }
    }
}
