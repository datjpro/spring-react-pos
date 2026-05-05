package com.pos.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "branches")
public class BranchEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 50) private String code;
    @Column(nullable = false, length = 255) private String name;
    @Column(length = 500) private String address;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @PrePersist public void prePersist(){Instant now=Instant.now(); createdAt=now; updatedAt=now;}
    @PreUpdate public void preUpdate(){updatedAt=Instant.now();}
    public Long getId(){return id;} public String getCode(){return code;} public void setCode(String code){this.code=code;}
    public String getName(){return name;} public void setName(String name){this.name=name;} public String getAddress(){return address;} public void setAddress(String address){this.address=address;}
    public boolean isActive(){return active;} public void setActive(boolean active){this.active=active;} public Instant getCreatedAt(){return createdAt;} public Instant getUpdatedAt(){return updatedAt;}
}
