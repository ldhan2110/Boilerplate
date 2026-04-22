package com.clt.hrm.infra.report.config;

import java.io.File;
import java.net.URI;

import org.docx4j.fonts.IdentityPlusMapper;
import org.docx4j.fonts.Mapper;
import org.docx4j.fonts.PhysicalFont;
import org.docx4j.fonts.PhysicalFonts;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class Docx4jConfig {

    private static final String FONT_BASE_PATH = "fonts/manrope/";

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @PostConstruct
    public void registerFonts() {
        register("Manrope", "Manrope-Regular.ttf");
        register("Manrope Bold", "Manrope-Bold.ttf");
        register("Manrope Medium", "Manrope-Medium.ttf");
        register("Manrope SemiBold", "Manrope-SemiBold.ttf");
    }

    private void register(String fontName, String fileName) {
        try {
            ClassPathResource resource = new ClassPathResource(FONT_BASE_PATH + fileName);
            URI uri = resource.getURI();
            PhysicalFonts.addPhysicalFonts(fontName, uri);
            
        } catch (Exception e) {
            log.warn("[Docx4jConfig] Could not load font {}: {}", fileName, e.getMessage());
        }
    }

    @Bean
    public Mapper fontMapper() {
        try {
            String cacheDir = System.getProperty("java.io.tmpdir") + "/docx4j-fonts";
            File cacheDirFile = new File(cacheDir);
            if (!cacheDirFile.mkdirs() && !cacheDirFile.exists()) {
                log.warn("[Docx4jConfig] Could not create cache directory: {}", cacheDir);
            }
            
            System.setProperty("user.home", cacheDir);
            
            Mapper mapper = new IdentityPlusMapper();
            PhysicalFont manrope = PhysicalFonts.get("Manrope");
    
            if (manrope == null) {
                log.error("[Docx4jConfig] Manrope font not registered");
                return mapper;
            }
            
            mapper.put("Manrope", manrope);
            mapper.put("Calibri", manrope);
            mapper.put("Calibri Light", manrope);
            mapper.put("Arial", manrope);
            mapper.put("Times New Roman", manrope);
            mapper.put("Tahoma", manrope);
            mapper.put("Verdana", manrope);
            return mapper;
            
        } catch (Exception e) {
            log.error("[Docx4jConfig] Error initializing font mapper", e);
            return new IdentityPlusMapper();
        }
    }
}
