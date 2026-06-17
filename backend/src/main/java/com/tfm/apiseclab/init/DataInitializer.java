package com.tfm.apiseclab.init;

import com.tfm.apiseclab.model.Account;
import com.tfm.apiseclab.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Inicializador de datos semilla para el laboratorio.
 *
 * Se ejecuta automáticamente al arrancar la aplicación (implementa
 * CommandLineRunner). Crea las cuentas de prueba que se usan para
 * demostrar BOLA/IDOR.
 *
 * ¿Por qué datos semilla en código y no en data.sql?
 *   1. Es más legible y mantenible (Java con tipos vs. SQL crudo).
 *   2. Se puede documentar por qué cada dato existe.
 *   3. Es independiente del dialecto SQL (H2 tiene pequeñas diferencias
 *      con PostgreSQL/MySQL que podrían ser confusas).
 *
 * DATOS DE PRUEBA — 3 usuarios, cada uno con cuentas:
 *
 *   Usuario 1 (Alice): Es la "víctima" por defecto en las demos.
 *     - Cuenta 1: saldo alto, datos sensibles visibles.
 *
 *   Usuario 2 (Bob): Es el "atacante" por defecto.
 *     - Cuenta 2: saldo más bajo — motiva el ataque ("quiero ver qué tiene Alice").
 *
 *   Usuario 3 (Charlie): Usuario adicional para demostrar escalabilidad
 *     del ataque (no solo funciona entre 2 usuarios).
 *     - Cuenta 3 y 4: dos cuentas para demostrar listados.
 *
 * Los IBANs son inventados (formato ES + 22 dígitos) pero plausibles.
 * Los saldos son intencionalmente diferentes para que sea evidente
 * cuándo se accede a datos ajenos.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;

    public DataInitializer(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public void run(String... args) {
        // Solo inicializar si la BD está vacía (evita duplicados en hot-reload)
        if (accountRepository.count() > 0) {
            return;
        }

        // --- Usuario 1: Alice (víctima habitual) ---
        // ownerId=1, saldo alto, datos sensibles
        accountRepository.save(new Account(
            1L,                                    // ownerId
            "Alice García",                        // ownerName
            "alice.garcia@example.com",            // email (dato sensible)
            "ES7921000813610123456789",             // IBAN (dato muy sensible)
            52_340.75                               // balance (alto → motiva el ataque)
        ));

        // --- Usuario 2: Bob (atacante habitual) ---
        // ownerId=2, saldo bajo — en la demo, Bob intenta ver la cuenta de Alice
        accountRepository.save(new Account(
            2L,
            "Bob Martínez",
            "bob.martinez@example.com",
            "ES3020384023795201384756",
            1_205.50
        ));

        // --- Usuario 3: Charlie (demuestra que el ataque escala) ---
        // ownerId=3, tiene dos cuentas para demostrar listados
        accountRepository.save(new Account(
            3L,
            "Charlie López",
            "charlie.lopez@example.com",
            "ES5530046590876123456789",
            8_750.00
        ));

        accountRepository.save(new Account(
            3L,                                     // Misma ownerId que la anterior
            "Charlie López",
            "charlie.lopez@example.com",
            "ES5530046590876987654321",              // Segundo IBAN (cuenta de ahorro)
            23_100.00
        ));

        System.out.println("[DataInitializer] Datos semilla cargados: "
            + accountRepository.count() + " cuentas creadas.");
    }
}
