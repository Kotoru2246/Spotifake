package com.spotifake;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalManagementPort;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/** Prometheus metrics live on the management port only, never on the public player port. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"management.server.port=0", "server.admin.port=0"})
@AutoConfigureObservability // metric export is off in tests by default
class MetricsEndpointTest extends IntegrationTestBase {

    @Autowired TestRestTemplate http;
    @LocalServerPort int appPort;
    @LocalManagementPort int managementPort;

    private ResponseEntity<String> get(int port, String path) {
        return http.getForEntity("http://127.0.0.1:" + port + path, String.class);
    }

    @Test
    void managementPortServesHealthAndPrometheusMetrics() {
        assertThat(get(managementPort, "/actuator/health").getBody()).contains("\"UP\"");
        ResponseEntity<String> metrics = get(managementPort, "/actuator/prometheus");
        assertThat(metrics.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(metrics.getBody()).contains("jvm_memory_used_bytes");
    }

    @Test
    void publicPortDoesNotExposeMetrics() {
        assertThat(managementPort).isNotEqualTo(appPort);
        assertThat(get(appPort, "/actuator/prometheus").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
