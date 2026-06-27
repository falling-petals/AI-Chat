package com.aichat.service;

import com.aichat.common.Result;
import com.aichat.dto.LoginRequest;
import com.aichat.dto.RegisterRequest;

public interface AuthService {
    Result<?> register(RegisterRequest req);
    Result<?> login(LoginRequest req);
}
