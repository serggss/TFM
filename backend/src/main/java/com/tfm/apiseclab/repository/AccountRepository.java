package com.tfm.apiseclab.repository;

import com.tfm.apiseclab.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de acceso a datos para la entidad Account.
 *
 * Extiende JpaRepository, que proporciona automáticamente:
 *   - findById(Long id)  → buscar por ID (usado en BOLA).
 *   - findAll()           → listar todas las cuentas.
 *   - save(Account a)     → guardar/actualizar.
 *   - deleteById(Long id) → eliminar.
 *
 * Los métodos custom (findByOwnerId) siguen la convención de Spring Data:
 * el nombre del método se parsea automáticamente para generar la query SQL.
 * No hace falta escribir @Query ni SQL nativo.
 *
 * Métodos relevantes para BOLA/IDOR:
 *   - findByOwnerId: obtiene las cuentas de un usuario concreto.
 *     Se usa en el estado "fixed" para devolver SOLO las cuentas del
 *     usuario autenticado, ignorando cualquier parámetro externo.
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    /**
     * Busca todas las cuentas que pertenecen a un usuario.
     *
     * Spring Data genera automáticamente:
     *   SELECT * FROM accounts WHERE owner_id = ?
     *
     * @param ownerId ID del usuario propietario.
     * @return lista de cuentas del usuario (puede estar vacía).
     */
    List<Account> findByOwnerId(Long ownerId);
}
