package com.pos.entity;

import lombok.Getter;
import lombok.Setter;

import com.pos.entity.base.BaseEntity;

import jakarta.persistence.*;

@Entity
@Getter
@Setter
@Table(name = "suppliers")
public class SupplierEntity extends BaseEntity {
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    @Column(nullable = false, length = 255)
    private String name;
    @Column(length = 100)
    private String phone;
    @Column(length = 255)
    private String email;
    @Column(length = 500)
    private String address;
    @Column(nullable = false)
    private boolean active = true;



}
