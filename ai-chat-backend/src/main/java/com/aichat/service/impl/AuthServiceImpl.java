package com.aichat.service.impl;

import com.aichat.common.Result;
import com.aichat.dto.LoginRequest;
import com.aichat.dto.RegisterRequest;
import com.aichat.entity.User;
import com.aichat.mapper.UserMapper;
import com.aichat.service.AuthService;
import com.aichat.util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserMapper userMapper, JwtUtil jwtUtil, BCryptPasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(rollbackFor = Exception.class)
    public Result<?> register(RegisterRequest req) {
        User exist = userMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                        .eq(User::getUsername, req.getUsername()));
        if (exist != null) {
            return Result.error(400, "Username already exists");
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPasswordHash(hashPassword(req.getPassword()));
        userMapper.insert(user);
        String token = jwtUtil.generate(user.getId(), user.getUsername());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("username", user.getUsername());
        data.put("avatar", user.getAvatar());
        return Result.success(data);
    }

    public Result<?> login(LoginRequest req) {
        User user = userMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                        .eq(User::getUsername, req.getUsername()));
        if (user == null || !verifyPassword(req.getPassword(), user.getPasswordHash())) {
            return Result.error(400, "Invalid username or password");
        }
        String token = jwtUtil.generate(user.getId(), user.getUsername());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("username", user.getUsername());
        data.put("avatar", user.getAvatar());
        return Result.success(data);
    }

    private String hashPassword(String raw) {
        return passwordEncoder.encode(raw);
    }

    private boolean verifyPassword(String raw, String hash) {
        return passwordEncoder.matches(raw, hash);
    }
}
