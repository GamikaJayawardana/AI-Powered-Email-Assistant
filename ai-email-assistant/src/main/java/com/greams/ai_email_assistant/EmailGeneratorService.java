package com.greams.ai_email_assistant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Generates email replies using a RAG (Retrieval-Augmented Generation) architecture.
 *
 * <p><b>RAG flow executed on every call to {@link #generateEmailReply}:</b>
 * <ol>
 *   <li><b>Retrieve</b> — the incoming email text is used as a semantic query against the
 *       MongoDB Atlas Vector Store. The top {@value #MAX_RETRIEVAL_RESULTS} past emails
 *       from the same user (filtered by {@code userId}) are returned as writing samples.</li>
 *   <li><b>Augment</b> — the retrieved samples are formatted and injected into a structured
 *       two-part prompt via Spring AI {@link SystemPromptTemplate} and {@link PromptTemplate}.
 *       The system message instructs the model to analyse and mimic the user's style;
 *       the user message carries the email to reply to alongside any tone/length overrides.</li>
 *   <li><b>Generate</b> — the assembled {@link Prompt} is forwarded to the Gemini model
 *       via {@link ChatClient}. The model returns a single reply that mirrors the user's
 *       writing style.</li>
 * </ol>
 *
 * <p>If no past emails exist for a user (e.g., first-time use), the pipeline degrades
 * gracefully to zero-shot generation with a neutral professional style.
 */
@Service
public class EmailGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(EmailGeneratorService.class);

    private static final int    MAX_RETRIEVAL_RESULTS = 5;
    private static final double SIMILARITY_THRESHOLD  = 0.65;

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            You are an expert email ghostwriter whose sole job is to draft replies that are
            indistinguishable from emails the user would write themselves.

            Below are real emails sent by this user. Study them carefully.

            ===== USER'S WRITING SAMPLES =====
            {writingSamples}
            ===================================

            From these samples, extract and faithfully replicate:
            - Formality level (casual, semi-formal, or professional)
            - Vocabulary choices and preferred phrases
            - Sentence length and punctuation style
            - Greeting and sign-off patterns
            - Paragraph structure and typical email length

            Write ONLY the email body. Do NOT add a subject line, meta-commentary, or options.
            """;

    private static final String USER_PROMPT_TEMPLATE = """
            Draft exactly ONE reply to the email below. Output ONLY the reply body.

            {toneInstruction}{lengthInstruction}{customInstruction}
            ===== EMAIL TO REPLY TO =====
            {originalEmail}
            =============================
            """;

    private static final String NO_SAMPLES_NOTICE =
            "[No past writing samples found — replying in a neutral professional style.]\n";

    
    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    
    public EmailGeneratorService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore) {
        this.chatClient  = chatClientBuilder.build();
        this.vectorStore = vectorStore;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Executes the full RAG pipeline and returns a generated email reply.
     *
     * @param emailRequest the incoming email content, user ID, and optional overrides
     * @return the generated reply text (email body only)
     */
    public String generateEmailReply(EmailRequest emailRequest) {
        log.info("Starting RAG reply generation for userId='{}'", emailRequest.getUserId());

        // Retrieve semantically similar past emails (writing-style context)
        List<Document> writingSamples = retrieveSimilarEmails(emailRequest);
        log.debug("Retrieved {} writing sample(s) from vector store", writingSamples.size());

        // Format retrieved documents into a numbered context block
        String writingSamplesContext = formatWritingSamples(writingSamples);

        // Assemble the variable map shared by both prompt templates
        Map<String, Object> promptVars = Map.of(
                "writingSamples",   writingSamplesContext,
                "originalEmail",    emailRequest.getEmailContent(),
                "toneInstruction",  buildToneInstruction(emailRequest.getTone()),
                "lengthInstruction", buildLengthInstruction(emailRequest.getLength()),
                "customInstruction", buildCustomInstruction(emailRequest.getCustomInstructions())
        );

        // Render templates: SystemPromptTemplate → system role message,
        // PromptTemplate → user turn message
        Message systemMessage = new SystemPromptTemplate(SYSTEM_PROMPT_TEMPLATE)
                .createMessage(promptVars);
        Message userMessage   = new PromptTemplate(USER_PROMPT_TEMPLATE)
                .createMessage(promptVars);

        //Call the LLM with the assembled two-part prompt
        String reply = chatClient
                .prompt(new Prompt(List.of(systemMessage, userMessage)))
                .call()
                .content();

        log.info("Successfully generated reply for userId='{}'", emailRequest.getUserId());
        return reply;
    }

    
    private List<Document> retrieveSimilarEmails(EmailRequest emailRequest) {
        try {
            SearchRequest.Builder builder = SearchRequest.builder()
                    .query(emailRequest.getEmailContent())
                    .topK(MAX_RETRIEVAL_RESULTS)
                    .similarityThreshold(SIMILARITY_THRESHOLD);

            if (emailRequest.getUserId() != null && !emailRequest.getUserId().isBlank()) {
                
                builder.filterExpression("userId == '" + emailRequest.getUserId() + "'");
            } else {
                log.warn("No userId provided — vector search will not be filtered by user");
            }

            return vectorStore.similaritySearch(builder.build());

        } catch (Exception ex) {
            log.warn("Vector store retrieval failed; falling back to zero-shot generation. Cause: {}",
                    ex.getMessage());
            return List.of();
        }
    }

    /** Formats retrieved {@link Document} objects into a numbered, human-readable block. */
    private String formatWritingSamples(List<Document> documents) {
        if (documents.isEmpty()) {
            return NO_SAMPLES_NOTICE;
        }
        var sb = new StringBuilder();
        for (int i = 0; i < documents.size(); i++) {
            sb.append("--- Sample ").append(i + 1).append(" ---\n")
              .append(documents.get(i).getText())
              .append("\n\n");
        }
        return sb.toString().trim();
    }

    private String buildToneInstruction(String tone) {
        return (tone != null && !tone.isBlank())
                ? "Tone: Write in a " + tone + " tone.\n"
                : "";
    }

    private String buildLengthInstruction(String length) {
        return (length != null && !length.isBlank())
                ? "Length: Keep the reply " + length + ".\n"
                : "";
    }

    private String buildCustomInstruction(String customInstructions) {
        return (customInstructions != null && !customInstructions.isBlank())
                ? "Additional instructions: " + customInstructions + "\n"
                : "";
    }
}
