package com.rumbo.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.TimeZone;

@SpringBootApplication
@EnableAsync
public class RumboApiApplication {

	public static void main(String[] args) {
		// Stays are in Colombia: "today" for searches, availability and reviews is Bogota's today, whatever the host zone.
		TimeZone.setDefault(TimeZone.getTimeZone("America/Bogota"));
		SpringApplication.run(RumboApiApplication.class, args);
	}

}
