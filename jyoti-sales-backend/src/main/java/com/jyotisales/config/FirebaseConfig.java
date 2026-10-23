package com.jyotisales.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Configuration
public class FirebaseConfig {

    private static final String SERVICE_ACCOUNT_PATH = "firebase-service-account.json";

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        InputStream credentialsStream = null;

        // 1. Try environment variable first (production / Render)
        String envJson = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (envJson != null && !envJson.isBlank()) {
            credentialsStream = new ByteArrayInputStream(envJson.getBytes(StandardCharsets.UTF_8));
            log.info("[Firebase] Initialized from FIREBASE_SERVICE_ACCOUNT_JSON env var");
        }

        // 2. Fallback to classpath file (local dev)
        if (credentialsStream == null) {
            ClassPathResource resource = new ClassPathResource(SERVICE_ACCOUNT_PATH);
            if (resource.exists()) {
                credentialsStream = resource.getInputStream();
                log.info("[Firebase] Initialized from classpath:{}", SERVICE_ACCOUNT_PATH);
            }
        }

        if (credentialsStream == null) {
            log.warn("[Firebase] No credentials found — Google/Phone login disabled.");
            return null;
        }

        GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream);
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();
        return FirebaseApp.initializeApp(options);
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp app) {
        if (app == null) return null;
        return FirebaseAuth.getInstance(app);
    }
}
