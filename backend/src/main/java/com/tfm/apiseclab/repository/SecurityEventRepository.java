package com.tfm.apiseclab.repository;

import com.tfm.apiseclab.model.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    List<SecurityEvent> findByVulnerabilityOrderByTimestampDesc(String vulnerability);

    List<SecurityEvent> findByStateOrderByTimestampDesc(String state);

    List<SecurityEvent> findAllByOrderByTimestampDesc();
}
