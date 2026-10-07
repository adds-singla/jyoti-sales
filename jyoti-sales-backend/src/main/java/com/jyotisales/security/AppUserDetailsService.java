package com.jyotisales.security;

import com.jyotisales.entity.User;
import com.jyotisales.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrPhone) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(usernameOrPhone)
                .or(() -> userRepository.findByPhone(usernameOrPhone))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrPhone));
        return new UserPrincipal(user);
    }
}
