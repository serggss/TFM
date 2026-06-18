package com.tfm.apiseclab.init;

import com.tfm.apiseclab.model.Account;
import com.tfm.apiseclab.model.UserProfile;
import com.tfm.apiseclab.repository.AccountRepository;
import com.tfm.apiseclab.repository.UserProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;

    public DataInitializer(AccountRepository accountRepository,
                           UserProfileRepository userProfileRepository) {
        this.accountRepository = accountRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    public void run(String... args) {
        initAccounts();
        initUserProfiles();
    }

    private void initAccounts() {
        if (accountRepository.count() > 0) return;

        accountRepository.save(new Account(1L, "Alicia García",
                "alicia.garcia@example.com", "ES7921000813610123456789", 52_340.75));
        accountRepository.save(new Account(2L, "Roberto Martínez",
                "roberto.martinez@example.com", "ES3020384023795201384756", 1_205.50));
        accountRepository.save(new Account(3L, "Carlos López",
                "carlos.lopez@example.com", "ES5530046590876123456789", 8_750.00));
        accountRepository.save(new Account(3L, "Carlos López",
                "carlos.lopez@example.com", "ES5530046590876987654321", 23_100.00));

        System.out.println("[DataInitializer] " + accountRepository.count() + " cuentas creadas.");
    }

    private void initUserProfiles() {
        if (userProfileRepository.count() > 0) return;

        userProfileRepository.save(new UserProfile(
                "alicia", "password123", "Alicia García", "alicia.garcia@example.com",
                "Investigadora de seguridad", "user", 52_340.75, true, 0.0));

        userProfileRepository.save(new UserProfile(
                "roberto", "password456", "Roberto Martínez", "roberto.martinez@example.com",
                "Desarrollador junior", "user", 1_205.50, false, 0.0));

        userProfileRepository.save(new UserProfile(
                "carlos", "password789", "Carlos López", "carlos.lopez@example.com",
                "Ingeniero DevOps", "user", 8_750.00, true, 5.0));

        userProfileRepository.save(new UserProfile(
                "admin", "admin", "Administrador", "admin@apiseclab.com",
                "Cuenta de administración", "admin", 0.0, true, 0.0));

        System.out.println("[DataInitializer] " + userProfileRepository.count() + " perfiles creados.");
    }
}
