/**
 * Ian Cunningham 3/11/2026
 */
package com.galicticmaps.maps;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * This is how to start up springboot to the local host.
 * Paste this into the url: http://localhost:8080
 */
@SpringBootApplication
public class MapsApplication {

	public static void main(String[] args) {
		SpringApplication.run(MapsApplication.class, args);
	}

}