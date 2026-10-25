package com.invite.config;

import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves photos from a folder on the server at /uploads/**, so you can add or
 * swap pictures without rebuilding the jar. Set invite.uploads-dir to enable.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final InviteProperties props;

    public WebConfig(InviteProperties props) {
        this.props = props;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String dir = props.uploadsDir();
        if (dir != null && !dir.isBlank()) {
            String location = Path.of(dir).toAbsolutePath().toUri().toString();
            registry.addResourceHandler("/uploads/**").addResourceLocations(location);
        }
    }
}
