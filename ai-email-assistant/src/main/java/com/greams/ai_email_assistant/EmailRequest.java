package com.greams.ai_email_assistant;

import lombok.Data;

@Data
public class EmailRequest {

    /** The full text of the incoming email that needs a reply. */
    private String emailContent;

    /** Optional tone override (e.g., "formal", "friendly", "concise"). */
    private String tone;

    /** Optional free-form instructions for the LLM (e.g., "mention the meeting on Friday"). */
    private String customInstructions;

    /** Optional length guidance (e.g., "brief", "detailed", "under 100 words"). */
    private String length;

    /**
     * Identifies the user requesting the reply.
     * Used to scope the MongoDB Atlas vector search to this user's own past emails,
     * ensuring the retrieved writing samples reflect their personal style — not another user's.
     */
    private String userId;
}
