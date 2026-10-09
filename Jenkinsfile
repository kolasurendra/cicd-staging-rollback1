pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/kolasurendra/cicd-staging-rollback.git'
            }
        }

        stage('Application Check') {
            steps {
                sh 'ls -la'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t cicd-app:${BUILD_NUMBER} .'
            }
        }

        stage('Deploy to Staging') {
            steps {
                sh '''
                    docker stop cicd-app-staging || true
                    docker rm cicd-app-staging || true

                    docker run -d \
                        --name cicd-app-staging \
                        -p 8081:3000 \
                        cicd-app:${BUILD_NUMBER}
                '''
            }
        }
    }
}
