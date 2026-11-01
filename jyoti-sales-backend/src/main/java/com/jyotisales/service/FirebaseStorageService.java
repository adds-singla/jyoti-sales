package com.jyotisales.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.StorageClient;
import com.jyotisales.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FirebaseStorageService {

    private final FirebaseApp firebaseApp;

    @Value("${firebase.storage.bucket:jyoti-sales.firebasestorage.app}")
    private String bucketName;

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final java.util.Set<String> ALLOWED_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    /**
     * Uploads a product image to Firebase Storage and returns its public download URL.
     * Files are stored under products/{uuid}.{ext}
     */
    public String uploadProductImage(MultipartFile file) {
        // ── Validation ───────────────────────────────────────────────────────
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Image file is required");
        }
        if (file.getSize() > MAX_SIZE) {
            throw ApiException.badRequest("File too large – maximum 5 MB allowed");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw ApiException.badRequest("Only JPEG, PNG, WebP and GIF images are allowed");
        }

        // ── Build storage path ───────────────────────────────────────────────
        String ext = switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png"  -> "png";
            case "image/webp" -> "webp";
            case "image/gif"  -> "gif";
            default           -> "img";
        };
        String objectName = "products/" + UUID.randomUUID() + "." + ext;

        // ── Upload via Firebase Admin SDK ────────────────────────────────────
        try {
            var bucket = StorageClient.getInstance(firebaseApp).bucket(bucketName);
            var blob = bucket.create(objectName, file.getInputStream(), contentType);

            // Make it publicly readable
            blob.createAcl(com.google.cloud.storage.Acl.of(
                    com.google.cloud.storage.Acl.User.ofAllUsers(),
                    com.google.cloud.storage.Acl.Role.READER));

            // Build public URL
            String encodedPath = URLEncoder.encode(objectName, StandardCharsets.UTF_8);
            String url = String.format(
                    "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                    bucketName, encodedPath);

            log.info("Uploaded product image: {}", url);
            return url;

        } catch (IOException e) {
            log.error("Failed to upload image to Firebase Storage", e);
            throw ApiException.internal("Image upload failed: " + e.getMessage());
        }
    }
}
