package com.pos.security;

import com.pos.entity.UserEntity;
import com.pos.exception.UnauthorizedException;
import com.pos.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        UserEntity userEntity = userRepository.findByUsernameAndActiveTrue(username)
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + userEntity.getRole().name()));

        return User.builder()
                .username(userEntity.getUsername())
                .password(userEntity.getPassword())
                .authorities(authorities)
                .build();
    }
}
