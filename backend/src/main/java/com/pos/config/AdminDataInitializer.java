package com.pos.config;

import com.pos.common.enums.Role;
import com.pos.user.entity.UserEntity;
import com.pos.user.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminDataInitializer {

    @Bean
    public ApplicationRunner adminBootstrapRunner(UserRepository userRepository,
                                                  PasswordEncoder passwordEncoder,
                                                  AdminBootstrapProperties adminBootstrapProperties) {
        return arguments -> {
            if (!adminBootstrapProperties.enabled()) {
                return;
            }

            boolean adminExists = userRepository.findByUsernameAndActiveTrue(adminBootstrapProperties.username()).isPresent();
            if (adminExists) {
                return;
            }

            UserEntity adminUser = new UserEntity();
            adminUser.setUsername(adminBootstrapProperties.username());
            adminUser.setPassword(passwordEncoder.encode(adminBootstrapProperties.password()));
            adminUser.setRole(Role.valueOf(adminBootstrapProperties.role()));
            adminUser.setActive(true);
            userRepository.save(adminUser);
        };
    }
}
