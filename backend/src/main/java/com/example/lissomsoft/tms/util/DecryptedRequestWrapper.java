package com.example.lissomsoft.tms.util;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

public class DecryptedRequestWrapper extends HttpServletRequestWrapper {

    private final byte[] decryptedBody;

    public DecryptedRequestWrapper(HttpServletRequest request, byte[] decryptedBody) {
        super(request);
        this.decryptedBody = decryptedBody;
    }

    @Override
    public ServletInputStream getInputStream() {
        ByteArrayInputStream source = new ByteArrayInputStream(decryptedBody);
        return new ServletInputStream() {
            @Override
            public boolean isFinished() {
                return source.available() == 0;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener readListener) {

            }

            @Override
            public int read() {
                return source.read();
            }

            @Override
            public int read(byte[] b, int off, int len) {
                return source.read(b, off, len);
            }
        };
    }

    @Override
    public BufferedReader getReader() {
        return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
    }

    @Override
    public int getContentLength() {
        return decryptedBody.length;
    }

    @Override
    public long getContentLengthLong() {
        return decryptedBody.length;
    }

    @Override
    public String getContentType() {
        return decryptedBody.length == 0 ? super.getContentType() : "application/json;charset=UTF-8";
    }

    @Override
    public String getHeader(String name) {
        if ("Content-Type".equalsIgnoreCase(name) && decryptedBody.length > 0) {
            return "application/json;charset=UTF-8";
        }
        return super.getHeader(name);
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
        if ("Content-Type".equalsIgnoreCase(name) && decryptedBody.length > 0) {
            return Collections.enumeration(List.of("application/json;charset=UTF-8"));
        }
        return super.getHeaders(name);
    }
}
