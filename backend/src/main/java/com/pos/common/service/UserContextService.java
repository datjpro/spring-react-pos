package com.pos.common.service;

import com.pos.common.exception.UnauthorizedException;
import com.pos.user.entity.UserEntity;
import com.pos.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class UserContextService {
    private final UserRepository userRepository;
    public UserContextService(UserRepository userRepository){this.userRepository=userRepository;}
    public UserEntity requireUser(Authentication authentication){
        if (authentication == null || authentication.getName() == null) throw new UnauthorizedException("Authentication required");
        return userRepository.findByUsernameAndActiveTrue(authentication.getName()).orElseThrow(() -> new UnauthorizedException("User not found"));
    }
}
