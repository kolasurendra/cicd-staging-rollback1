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

        stage('Health Check - Staging') {
            steps {
                sh '''
                    echo "Checking staging application health..."

                    for i in {1..10}
                    do
                        if curl -f http://localhost:8081/health
                        then
                            echo "Staging health check PASSED"
                            exit 0
                        fi

                        echo "Health check failed. Retrying..."
                        sleep 5
                    done

                    echo "Staging health check FAILED"
                    exit 1
                '''
            }
        }
    }
}
