package com.greams.ai_email_assistant;

import lombok.Data;


@Data
public class EmailIngestionRequest {

    /** Full text body of the past email to embed and persist. */
    private String emailContent;

    /**
     * The user whose writing style this email represents.
     * Must match the {@code userId} sent in future {@link EmailRequest}s
     * so vector store filtering returns this user's samples only.
     */
    private String userId;

    /**
     * Optional label describing the email's origin.
     * Accepted values: {@code "SENT"}, {@code "DRAFT"}.
     * Defaults to {@code "SENT"} if omitted.
     */
    private String emailType;
}
