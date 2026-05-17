package com.pos.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.common.enums.Role;
import com.pos.common.exception.GlobalExceptionHandler;
import com.pos.common.exception.UnauthorizedException;
import com.pos.dtos.response.StockLevelPageResponse;
import com.pos.dtos.response.StockLevelResponse;
import com.pos.entities.UserEntity;
import com.pos.services.BranchProductStockService;
import com.pos.services.UserContextService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StockLevelControllerTest {

    @Mock
    private BranchProductStockService branchProductStockService;
    @Mock
    private UserContextService userContextService;

    @InjectMocks
    private StockLevelController stockLevelController;

    private MockMvc mockMvc;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(stockLevelController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        authentication = new UsernamePasswordAuthenticationToken("manager", null);
    }

    @Test
    void shouldReturnStockLevelsSuccessfully() throws Exception {
        UserEntity user = new UserEntity();
        user.setUsername("manager");
        user.setRole(Role.MANAGER);

        when(userContextService.requireUser(any(Authentication.class))).thenReturn(user);
        when(branchProductStockService.findStockLevels(eq(user), eq(1L), eq(null), eq(0), eq(20)))
                .thenReturn(new StockLevelPageResponse(
                        List.of(new StockLevelResponse(1L, "Coffee", "SP-01", 1L, "CN-01", 5)),
                        1L, 1, 0, 20
                ));

        mockMvc.perform(get("/api/v1/stock-levels")
                        .principal(authentication)
                        .param("branchId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].productId").value(1))
                .andExpect(jsonPath("$.content[0].stock").value(5));
    }

    @Test
    void shouldReturnUnauthorizedWhenUserMissing() throws Exception {
        when(userContextService.requireUser(any(Authentication.class))).thenThrow(new UnauthorizedException("User not found"));

        mockMvc.perform(get("/api/v1/stock-levels").principal(authentication))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }
}
