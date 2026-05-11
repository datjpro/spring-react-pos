package com.pos.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "POS Backend API",
                version = "v1",
                description = "OpenAPI documentation for Spring React POS backend"
        ),
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {

    @Bean
    public OpenAPI posOpenApi() {
        return new OpenAPI().servers(List.of(
                new Server().url("http://localhost:8080").description("Local backend")
        ));
    }

    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder().group("auth").pathsToMatch("/api/v1/auth/**").build();
    }

    @Bean
    public GroupedOpenApi userApi() {
        return GroupedOpenApi.builder().group("users").pathsToMatch("/api/v1/users/**").build();
    }

    @Bean
    public GroupedOpenApi catalogApi() {
        return GroupedOpenApi.builder()
                .group("catalog")
                .pathsToMatch("/api/v1/products/**", "/api/v1/branches/**", "/api/v1/suppliers/**")
                .build();
    }

    @Bean
    public GroupedOpenApi operationsApi() {
        return GroupedOpenApi.builder()
                .group("operations")
                .pathsToMatch(
                        "/api/v1/orders/**",
                        "/api/v1/payments/**",
                        "/api/v1/inventory/**",
                        "/api/v1/stock-movements/**",
                        "/api/v1/purchases/**",
                        "/api/v1/sales/**"
                )
                .build();
    }

    @Bean
    public GroupedOpenApi reportingApi() {
        return GroupedOpenApi.builder()
                .group("reporting")
                .pathsToMatch("/api/v1/reports/**", "/api/v1/audit-logs/**")
                .build();
    }
}
