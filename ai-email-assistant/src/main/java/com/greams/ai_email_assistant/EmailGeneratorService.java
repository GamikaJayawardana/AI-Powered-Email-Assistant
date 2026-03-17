package com.greams.ai_email_assistant;

import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;



    public EmailGeneratorService(WebClient webClient) {
        this.webClient = webClient;
    }


    public String generateEmailReply (EmailRequest emailRequest) {
        // Build the prompt
        String prompt = buildPrompt(emailRequest);

        // Craft a Request
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[] {
                        Map.of("parts", new Object[]{
                                Map.of("text",prompt)
                        })
                }
        );

        // Do Request and get Response
        String response = webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // Return Response
        return extractResponseContent(response);
    }

    private String extractResponseContent(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(response);
            String text = rootNode.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            // Optional: Clean up markdown if the AI includes it
            return text.replaceAll("```[a-z]*", "").replaceAll("```", "").trim();
        } catch (Exception e) {
            return "Error processing request: " + e.getMessage();
        }
    }

    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder();
        // Specific instructions to prevent "Option 1, Option 2" output
        prompt.append("You are a professional email assistant. ")
                .append("Generate exactly ONE professional email reply for the following content. ")
                .append("Do not include a subject line, do not offer multiple options, and do not include any conversational filler before or after the email. ");

        // Corrected the ! logic here
        if (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()) {
            prompt.append("Use a ").append(emailRequest.getTone()).append(" tone. ");
        }

        if (emailRequest.getLength() != null && !emailRequest.getLength().isEmpty()) {
            prompt.append("Make the length of the reply ").append(emailRequest.getLength()).append(". ");
        }

        if (emailRequest.getCustomInstructions() != null && !emailRequest.getCustomInstructions().isEmpty()) {
            prompt.append("Follow these custom instructions exactly: ").append(emailRequest.getCustomInstructions()).append(". ");
        }

        prompt.append("\nOriginal Email: \n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }
}
