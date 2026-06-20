package com.greams.ai_email_assistant;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for feeding past emails into the vector store.
 *
 * <p>Call these once (or on a scheduled basis) to build up a user's writing-style
 * corpus before invoking {@code POST /api/email/generate}.
 *
 * <ul>
 *   <li>{@code POST /api/email/ingest}       — single email</li>
 *   <li>{@code POST /api/email/ingest/batch} — list of emails in one request</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/email")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class EmailIngestionController {

    private final EmailIngestionService emailIngestionService;

    @PostMapping("/ingest")
    public ResponseEntity<String> ingestEmail(@RequestBody EmailIngestionRequest request) {
        emailIngestionService.ingestEmail(request);
        return ResponseEntity.ok("Email ingested successfully.");
    }

    @PostMapping("/ingest/batch")
    public ResponseEntity<String> ingestEmails(@RequestBody List<EmailIngestionRequest> requests) {
        emailIngestionService.ingestEmails(requests);
        return ResponseEntity.ok("Batch of " + requests.size() + " email(s) ingested successfully.");
    }
}
