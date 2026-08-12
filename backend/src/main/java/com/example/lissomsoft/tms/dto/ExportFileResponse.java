package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Every API response body in this app is transparently AES-GCM encrypted by
 * {@code EncryptionFilter} and then base64-decoded/UTF-8-decoded again on the
 * Angular side. Raw binary (xlsx/pdf) bytes would not survive that UTF-8
 * round trip intact, so downloadable files are wrapped as base64 text inside
 * an ordinary JSON body instead - it travels through the existing encryption
 * pipeline safely and the frontend turns it back into a Blob for download.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportFileResponse {
    private String fileName;
    private String contentType;
    private String base64Data;
}
