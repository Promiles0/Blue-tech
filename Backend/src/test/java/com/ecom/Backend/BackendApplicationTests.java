package com.ecom.Backend;

import com.ecom.Backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.mail.host=localhost",
        "spring.mail.port=25",
        "app.admin.email=admin@test.com",
        "app.admin.password=admin123",
        "app.admin.name=Admin",
        "app.admin.phone=+250780000000",
        "app.google.web-client-id=test-client-id",
        "app.flutterwave.secret-key=test-secret",
        "app.flutterwave.webhook-secret=my_secret_hash",
        "app.frontend.url=http://localhost:5173",
        "app.upload.dir=uploads",
        "jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "jwt.expiration=86400000",
        "spring.security.oauth2.client.registration.google.client-id=test",
        "spring.security.oauth2.client.registration.google.client-secret=test"
})
class BackendApplicationTests {

    @MockBean
    EmailService emailService;

    @Test
    void contextLoads() {
    }
}
