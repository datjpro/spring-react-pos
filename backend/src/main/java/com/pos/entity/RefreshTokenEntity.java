package com.pos.entity;

import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

import com.pos.entity.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Getter
@Setter
@Table(name = "refresh_tokens")
public class RefreshTokenEntity extends BaseEntity {

    @Column(name = "token", nullable = false, unique = true, length = 512)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "expiry_at", nullable = false)
    private Instant expiryAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked = false;



}
