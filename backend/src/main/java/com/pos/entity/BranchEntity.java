package com.pos.entity;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.*;

@Entity
@Getter
@Setter
@Table(name = "branches")
public class BranchEntity extends BaseEntity {
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    @Column(nullable = false, length = 255)
    private String name;
    @Column(length = 500)
    private String address;
    @Column(nullable = false)
    private boolean active = true;

}
