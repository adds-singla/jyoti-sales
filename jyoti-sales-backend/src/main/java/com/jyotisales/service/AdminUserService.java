package com.jyotisales.service;

import com.jyotisales.entity.User;
import com.jyotisales.exception.ApiException;
import com.jyotisales.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public Page<User> listCustomers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User setBlocked(Long userId, boolean blocked) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setBlocked(blocked);
        return userRepository.save(user);
    }
}
