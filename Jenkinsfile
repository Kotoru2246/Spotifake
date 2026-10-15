pipeline {
    agent any
    tools {
        nodejs 'node20'
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
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
        stage('Install Dependencies') {
            steps {
                echo '=== Bước 2: Cài thư viện ==='
                sh 'npm install'
            }
        }
        stage('Test') {
            steps {
                echo '=== Bước 3: Chạy test ==='
                sh 'npm test || true'
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
                echo '=== Bước 5: Chờ kết quả Quality Gate ==='
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
    post {
        success {
            echo '🎉 Pipeline thành công!'
        }
        failure {
            echo '❌ Pipeline thất bại!'
        }
    }
}
