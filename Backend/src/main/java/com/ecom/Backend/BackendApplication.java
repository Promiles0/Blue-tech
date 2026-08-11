package com.ecom.Backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

@EnableAsync
@SpringBootApplication
public class BackendApplication {

	@Value("${DB_URL:NOT_SET}")
	private String debugDbUrl;

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

	@PostConstruct
	public void logDbUrl() {
		System.out.println("DB_URL as seen by Spring: " + debugDbUrl);
	}
}