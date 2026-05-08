package com.pos.repositories;

import com.pos.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    boolean existsByUsernameIgnoreCase(String username);

    Optional<UserEntity> findByUsernameAndActiveTrue(String username);
}
