package com.aichat.service;

import com.aichat.common.Result;
import com.aichat.dto.LoginRequest;
import com.aichat.dto.RegisterRequest;
import com.aichat.entity.User;
import com.aichat.mapper.UserMapper;
import com.aichat.util.JwtUtil;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;

    public AuthService(UserMapper userMapper, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
    }

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
        return Result.success(null);
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
        return org.springframework.util.DigestUtils.md5DigestAsHex(raw.getBytes());
    }

    private boolean verifyPassword(String raw, String hash) {
        return hashPassword(raw).equals(hash);
    }
}
