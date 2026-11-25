package com.rumbo.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RumboApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(RumboApiApplication.class, args);
	}

}
