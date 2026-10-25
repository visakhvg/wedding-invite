package com.invite;

import com.invite.config.InviteProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(InviteProperties.class)
public class InviteApplication {

    public static void main(String[] args) {
        SpringApplication.run(InviteApplication.class, args);
    }
}
