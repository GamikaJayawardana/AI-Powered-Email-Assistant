package com.greams.ai_email_assistant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Ingests past emails into the MongoDB Atlas Vector Store so the RAG pipeline
 * can retrieve them as writing-style samples during reply generation.
 *
 * <p><b>What happens internally when you call {@link #ingestEmail}:</b>
 * <ol>
 *   <li>The email text is wrapped in a Spring AI {@link Document} with metadata
 *       ({@code userId}, {@code emailType}, {@code ingestedAt}).</li>
 *   <li>Spring AI passes the text to the auto-configured {@code EmbeddingModel}
 *       (Google {@code text-embedding-004}), which returns a 768-dimensional vector.</li>
 *   <li>The {@link VectorStore} persists both the raw text and the vector into the
 *       {@code email_embeddings} collection in MongoDB Atlas.</li>
 * </ol>
 *
 * <p>The stored {@code userId} metadata enables {@link EmailGeneratorService} to filter
 * similarity searches so each user only retrieves their own writing samples.
 */
@Service
public class EmailIngestionService {

    private static final Logger log = LoggerFactory.getLogger(EmailIngestionService.class);

    private final VectorStore vectorStore;

    public EmailIngestionService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    /**
     * Embeds and persists a single past email.
     *
     * @param request contains the email body, owner's user ID, and optional email type
     * @throws IllegalArgumentException if {@code emailContent} or {@code userId} is blank
     */
    public void ingestEmail(EmailIngestionRequest request) {
        validateRequest(request);
        log.info("Ingesting email for userId='{}', type='{}'", request.getUserId(), request.getEmailType());

        Document document = buildDocument(request);
        vectorStore.add(List.of(document));

        log.info("Successfully ingested email document for userId='{}'", request.getUserId());
    }

    /**
     * Batch-embeds and persists a list of past emails in one vector store call.
     * Use this for bulk imports of a user's email history to minimise round-trips.
     *
     * @param requests list of ingestion requests (may span multiple users)
     * @throws IllegalArgumentException if any entry has blank {@code emailContent} or {@code userId}
     */
    public void ingestEmails(List<EmailIngestionRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            log.warn("ingestEmails called with empty list — nothing to do");
            return;
        }

        log.info("Batch-ingesting {} email(s)", requests.size());
        requests.forEach(this::validateRequest);

        List<Document> documents = requests.stream()
                .map(this::buildDocument)
                .toList();

        vectorStore.add(documents);
        log.info("Successfully batch-ingested {} email document(s)", documents.size());
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private Document buildDocument(EmailIngestionRequest request) {
        return new Document(
                request.getEmailContent(),
                Map.of(
                        "userId",     request.getUserId(),
                        "emailType",  request.getEmailType() != null ? request.getEmailType() : "SENT",
                        "ingestedAt", Instant.now().toString()
                )
        );
    }

    private void validateRequest(EmailIngestionRequest request) {
        if (request.getEmailContent() == null || request.getEmailContent().isBlank()) {
            throw new IllegalArgumentException("emailContent must not be blank");
        }
        if (request.getUserId() == null || request.getUserId().isBlank()) {
            throw new IllegalArgumentException("userId must not be blank");
        }
    }
}
