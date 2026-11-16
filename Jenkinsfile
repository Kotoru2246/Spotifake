pipeline {
    agent any
    tools {
        maven 'maven3'
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        IMAGE_NAME = 'spotifake-backend'
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
    }
    post {
        success {
            echo "🎉 Pipeline thành công! Docker image '${IMAGE_NAME}:latest' đã được tạo."
        }
        failure {
            echo '❌ Pipeline thất bại!'
        }
    }
}
