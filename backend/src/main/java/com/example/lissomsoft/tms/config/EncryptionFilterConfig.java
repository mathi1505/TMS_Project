package com.example.lissomsoft.tms.config;

import com.example.lissomsoft.tms.security.EncryptionFilter;
import com.example.lissomsoft.tms.util.AesGcmCipher;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class EncryptionFilterConfig {

    @Bean
    public EncryptionFilter encryptionFilter(AesGcmCipher cipher) {
        return new EncryptionFilter(cipher);
    }

    @Bean
    public FilterRegistrationBean<EncryptionFilter> encryptionFilterRegistration(EncryptionFilter encryptionFilter) {
        FilterRegistrationBean<EncryptionFilter> registration = new FilterRegistrationBean<>(encryptionFilter);
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.addUrlPatterns("/*");
        return registration;
    }
}
