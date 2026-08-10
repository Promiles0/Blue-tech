package com.ecom.Backend.service;

import com.ecom.Backend.entity.AuditLog;
import com.ecom.Backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("all")
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String action, String targetTable, String targetId, String details, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .action(action)
                .targetTable(targetTable)
                .targetId(targetId)
                .description(details)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String action, String targetTable, String details, String ipAddress) {
        log(userId, action, targetTable, null, details, ipAddress);
    }

    public List<AuditLog> getAllLogs(int limit) {
        return auditLogRepository.findAll(
            PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
    }

    public List<AuditLog> getAllLogs() {
        return getAllLogs(200);
    }
}
