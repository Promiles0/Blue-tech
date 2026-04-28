package com.ecom.Backend.service;

import com.ecom.Backend.entity.AuditLog;
import com.ecom.Backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log a sensitive action. 
     * Uses Propagation.REQUIRES_NEW to ensure the log is saved even if the main transaction rolls back,
     * which is useful for tracking failed attempts or important actions.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String action, String targetTable, String details, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .action(action)
                .targetTable(targetTable)
                .description(details)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }
}
