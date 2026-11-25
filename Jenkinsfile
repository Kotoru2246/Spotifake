pipeline {
    agent any
    tools {
        maven 'maven3'
    }
    options {
        disableConcurrentBuilds()
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }
    parameters {
        // Host paths (Docker Desktop). DATA_DIR must already contain backendai.db.
        string(name: 'DATA_DIR', defaultValue: '/c/Users/jacky/SpotifakeDemo',
               description: 'Host folder containing backendai.db for the deployed stack')
        string(name: 'UPLOADS_DIR', defaultValue: '/e/Spotifake/uploads', description: 'Host folder with uploaded audio')
        string(name: 'MUSIC_DIR', defaultValue: '/e/Spotifake/music', description: 'Host folder with downloaded music')
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        IMAGE_NAME = 'spotifake-backend'
        DATA_DIR = "${params.DATA_DIR}"
        UPLOADS_DIR = "${params.UPLOADS_DIR}"
        MUSIC_DIR = "${params.MUSIC_DIR}"
    }
    stages {
        stage('Checkout') {
            steps {
                echo '=== Bước 1: Lấy mã nguồn ==='
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
                // Secrets for docker compose, generated once per workspace and never printed or committed
                sh '''
                    [ -f "$WORKSPACE/../spotifake.env" ] || {
                        echo "INTERNAL_API_TOKEN=$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')"
                        echo "GRAFANA_ADMIN_PASSWORD=$(head -c 12 /dev/urandom | od -An -tx1 | tr -d ' \n')"
                    } > "$WORKSPACE/../spotifake.env"
                    cp "$WORKSPACE/../spotifake.env" .env
                '''
            }
        }
        stage('Build Spring Boot') {
            steps {
                echo '=== Bước 2: Biên dịch Java & Maven ==='
                dir('BackendSpringBoot') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }
        stage('Test') {
            steps {
                echo '=== Run JUnit tests (temp SQLite DB; a failing test fails the build) ==='
                dir('BackendSpringBoot') {
                    sh 'mvn test'
                }
            }
            post {
                always {
                    junit allowEmptyResults: false, testResults: 'BackendSpringBoot/target/surefire-reports/*.xml'
                }
            }
        }
        stage('SonarQube Analysis') {
            steps {
                echo '=== Bước 3: Quét mã nguồn SonarQube ==='
                withSonarQubeEnv('SonarQube') {
                    sh '"$SCANNER_HOME/bin/sonar-scanner"'
                }
            }
        }
        stage('Quality Gate') {
            steps {
                echo '=== Bước 4: Kiểm tra Quality Gate (không đạt thì dừng) ==='
                // Needs a SonarQube webhook pointing to <jenkins-url>/sonarqube-webhook/
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Build Docker Images') {
            steps {
                echo '=== Bước 5: Đóng gói Docker Containers ==='
                sh 'docker compose build'
                sh "docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:${BUILD_NUMBER}"
                sh "docker images | grep spotifake || true"
            }
        }
        stage('Auto-Deploy') {
            steps {
                echo '=== Bước 6: Tự động triển khai bằng Docker Compose ==='
                // spotifake-app is the container the old "docker run" deploy created; it holds port 8085
                sh 'docker rm -f spotifake-app || true'
                sh 'docker compose up -d --remove-orphans --wait --wait-timeout 300'
                echo '=== Running Containers ==='
                sh 'docker compose ps'
            }
        }
        stage('Smoke Test') {
            steps {
                echo '=== Bước 7: Kiểm tra sau triển khai ==='
                sh 'docker compose exec -T backend wget -qO- http://127.0.0.1:8000/ > /dev/null'
                sh 'docker compose exec -T backend wget -qO- http://127.0.0.1:8081/actuator/health | grep -q UP'
                sh 'docker compose exec -T backend wget -qO- http://backendai:5000/health | grep -q ok'
                sh 'docker compose exec -T prometheus wget -qO- http://127.0.0.1:9090/-/ready'
                sh 'docker compose exec -T grafana wget -qO- http://127.0.0.1:3000/api/health | grep -q ok'
            }
        }
    }
    post {
        success {
            echo "🎉 Pipeline & Tự động Triển khai thành công! Spotifake: http://localhost:8085 | Prometheus: http://localhost:9090 | Grafana: http://localhost:3030"
        }
        failure {
            echo '❌ Pipeline thất bại!'
        }
    }
}
