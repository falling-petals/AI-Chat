package com.aichat.service;

import com.aichat.common.Result;
import com.aichat.dto.LoginRequest;
import com.aichat.entity.User;
import com.aichat.mapper.UserMapper;
import com.aichat.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginShouldSucceedWhenAvatarIsNull() {
        User user = new User();
        user.setId(1L);
        user.setUsername("test123");
        user.setPasswordHash("cc03e747a6afbbcbf8be7668acfebee5");
        user.setAvatar(null);

        LoginRequest request = new LoginRequest();
        request.setUsername("test123");
        request.setPassword("test123");

        when(userMapper.selectOne(any())).thenReturn(user);
        when(jwtUtil.generate(1L, "test123")).thenReturn("mock-token");

        Result<?> result = authService.login(request);

        assertEquals(200, result.getCode());
        Map<?, ?> data = assertInstanceOf(Map.class, result.getData());
        assertEquals("mock-token", data.get("token"));
        assertEquals("test123", data.get("username"));
        assertNull(data.get("avatar"));
    }
}
