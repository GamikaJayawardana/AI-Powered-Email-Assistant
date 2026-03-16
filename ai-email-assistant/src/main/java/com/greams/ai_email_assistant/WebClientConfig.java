package com.greams.ai_email_assistant;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        // Create the WebClient directly without needing an external Builder bean
        return WebClient.builder().build();
    }
}