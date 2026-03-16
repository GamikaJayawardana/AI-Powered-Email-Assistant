package com.greams.ai_email_assistant;

import lombok.Data;

@Data
public class EmailRequest {
    private String emailContent;
    private String tone;
}
