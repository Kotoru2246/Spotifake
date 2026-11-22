pipeline {
    agent any
    tools {
        maven 'maven3'
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        IMAGE_NAME = 'spotifake-backend'
        CONTAINER_NAME = 'spotifake-app'
        PROJECT_DIR = '/c/Users/jacky/.gemini/antigravity-ide/scratch/Spotifake'
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
        stage('Build Docker Image') {
            steps {
                echo '=== Bước 3: Đóng gói Docker Container ==='
                sh "docker build -t ${IMAGE_NAME}:latest -t ${IMAGE_NAME}:${BUILD_NUMBER} ./BackendSpringBoot"
                echo "=== Docker Images ==="
                sh "docker images | grep ${IMAGE_NAME} || true"
            }
        }
        stage('SonarQube Analysis') {
            steps {
                echo '=== Bước 4: Quét mã nguồn SonarQube ==='
                withSonarQubeEnv('SonarQube') {
                    sh '"$SCANNER_HOME/bin/sonar-scanner"'
                }
            }
        }
        stage('Quality Gate') {
            steps {
                echo '=== Bước 5: Kiểm tra Quality Gate ==='
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }
        stage('Auto-Deploy') {
            steps {
                echo '=== Bước 6: Tự động triển khai (Auto-Deploy) Container ==='
                sh """
                    docker rm -f ${CONTAINER_NAME} || true
                    docker run -d --name ${CONTAINER_NAME} --restart unless-stopped \
                        -p 8085:8000 -p 9005:9000 \
                        -v "${PROJECT_DIR}/backendai.db:/app/backendai.db" \
                        -v "${PROJECT_DIR}/uploads:/app/uploads" \
                        -v "${PROJECT_DIR}/music:/app/music" \
                        ${IMAGE_NAME}:latest
                """
                echo '=== Running Containers ==='
                sh "docker ps | grep ${CONTAINER_NAME} || true"
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
