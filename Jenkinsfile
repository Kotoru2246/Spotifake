pipeline {
    agent any
    tools {
        maven 'maven3'
    }
    parameters {
        string(name: 'DATA_DIR', defaultValue: '/c/Users/jacky/.gemini/antigravity-ide/scratch/Spotifake',
               description: 'Host folder containing backendai.db, uploads/ and music/')
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        IMAGE_NAME = 'spotifake-backend'
        DATA_DIR = "${params.DATA_DIR}"
        // Jenkins "Secret text" credential with this ID must exist
        INTERNAL_API_TOKEN = credentials('spotifake-internal-token')
    }
    stages {
        stage('Checkout') {
            steps {
                echo '=== Bước 1: Lấy mã nguồn ==='
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
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
                sh 'docker compose up -d --remove-orphans'
                echo '=== Running Containers ==='
                sh 'docker compose ps'
            }
        }
    }
    post {
        success {
            echo "🎉 Pipeline & Tự động Triển khai thành công! Spotifake đang chạy tại http://localhost:8085"
        }
        failure {
            echo '❌ Pipeline thất bại!'
        }
    }
}
