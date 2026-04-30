# E-COMMERCE-PLATFORM
## Introduction

The E-Commerce Platform is a sophisticated full-stack solution designed to bridge the gap between high-end aesthetics and enterprise-grade reliability. 
Built using Spring Boot for a robust backend and React + Tailwind CSS for a cinematic frontend, this system handles the complete retail lifecycle—from intelligent
product discovery to secure financial transactions and automated shipment tracking.

## System Architecture
The system follows a strictly Tiered Micro-Architectural Pattern, ensuring high decoupling and easy scalability.

### Backend Structure (The "Brain")
* config/: System-wide configuration (Security, CORS, Data Seeding).
* controller/: REST API endpoints managing the request-response lifecycle.
* service/: The core business logic layer utilizing @Transactional integrity.
* entity/: JPA-mapped database models representing the relational schema.
* dto/: Data Transfer Objects for secure, filtered data transmission.
* repository/: Abstraction layer for database persistence (Spring Data JPA).
* security/: JWT and OAuth2 implementations for stateless authentication.
* exception/: Centralized Global Exception Handling.

## Tech Stack

Backend:	Java 17, Spring Boot, Spring Security

## Key Features
### Backend Excellence
1. Atomic Operations: Ensuring inventory and payments are always in sync.
2. Smart Seeding: Automatic creation of Master Admin and Categories on first boot.
3. Audit Logging: Internal tracking of every administrative action for accountability.
4. Notification Engine: Real-time triggers for emails and in-app notifications.

### Security & Integrity
1. Stateless Auth: All requests are validated via encrypted JWT tokens.
2. Password Safety: BCrypt hashing utilized for all user credentials.
3. CORS Protection: Pre-configured gatekeeping to prevent unauthorized API calls.
4. Data Privacy: DTO pattern prevents internal database leaks to the client.
