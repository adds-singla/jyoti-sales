package com.jyotisales.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnResource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;

@Slf4j
@Configuration
public class FirebaseConfig {

    private static final String SERVICE_ACCOUNT_PATH = "firebase-service-account.json";

    /**
     * Only registered when firebase-service-account.json is on the classpath.
     * Place it at: jyoti-sales-backend/src/main/resources/firebase-service-account.json
     * Or set firebase.service-account=file:/absolute/path in your env.
     */
    @Bean
    @ConditionalOnResource(resources = "classpath:" + SERVICE_ACCOUNT_PATH)
    public FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(new ClassPathResource(SERVICE_ACCOUNT_PATH).getInputStream());
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();
        log.info("[Firebase] Initialized successfully from classpath:{}", SERVICE_ACCOUNT_PATH);
        return FirebaseApp.initializeApp(options);
    }

    @Bean
    @ConditionalOnResource(resources = "classpath:" + SERVICE_ACCOUNT_PATH)
    public FirebaseAuth firebaseAuth(FirebaseApp app) {
        return FirebaseAuth.getInstance(app);
    }
}
