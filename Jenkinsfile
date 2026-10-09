pipeline {

    agent any

    parameters {
        choice(
            name: 'HEALTH_STATUS',
            choices: ['healthy', 'unhealthy'],
            description: 'Application health status for deployment testing'
        )
    }

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
                        -e HEALTH_STATUS=${HEALTH_STATUS} \
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

        stage('Save Previous Production Version') {
            steps {
                sh '''
                    if [ -f /opt/cicd/production-version.txt ]; then

                        CURRENT_VERSION=$(cat /opt/cicd/production-version.txt)

                        echo "Current production version: ${CURRENT_VERSION}"

                        echo "${CURRENT_VERSION}" \
                            > /opt/cicd/previous-production-version.txt

                    else
                        echo "No previous production version found."
                        exit 1
                    fi
                '''
            }
        }

        stage('Deploy to Production') {
            steps {
                sh '''
                    docker stop cicd-app-production || true
                    docker rm cicd-app-production || true

                    docker run -d \
                        --name cicd-app-production \
                        -p 8088:3000 \
                        -e HEALTH_STATUS=${HEALTH_STATUS} \
                        cicd-app:${BUILD_NUMBER}
                '''
            }
        }

        stage('Health Check - Production') {
            steps {
                sh '''
                    echo "Checking production application health..."

                    for i in {1..10}
                    do
                        if curl -f http://localhost:8088/health
                        then
                            echo "Production health check PASSED"
                            exit 0
                        fi

                        echo "Production health check failed. Retrying..."
                        sleep 5
                    done

                    echo "Production health check FAILED"
                    exit 1
                '''
            }
        }

        stage('Record Successful Production Version') {
            steps {
                sh '''
                    echo "${BUILD_NUMBER}" \
                        > /opt/cicd/production-version.txt

                    echo "Production version updated to ${BUILD_NUMBER}"
                '''
            }
        }
    }

    post {

        failure {

            sh '''
                echo "======================================"
                echo "DEPLOYMENT FAILED"
                echo "STARTING AUTOMATIC ROLLBACK"
                echo "======================================"

                PREVIOUS_VERSION=$(cat /opt/cicd/previous-production-version.txt)

                echo "Rolling back to version: ${PREVIOUS_VERSION}"

                docker stop cicd-app-production || true
                docker rm cicd-app-production || true

                docker run -d \
                    --name cicd-app-production \
                    -p 8088:3000 \
                    -e HEALTH_STATUS=healthy \
                    cicd-app:${PREVIOUS_VERSION}

                echo "Rollback container started."

                sleep 5

                echo "Checking rollback health..."

                if curl -f http://localhost:8088/health
                then
                    echo "======================================"
                    echo "ROLLBACK SUCCESSFUL"
                    echo "Production restored to version ${PREVIOUS_VERSION}"
                    echo "======================================"

                    echo "${PREVIOUS_VERSION}" \
                        > /opt/cicd/production-version.txt

                else
                    echo "======================================"
                    echo "ROLLBACK FAILED"
                    echo "======================================"

                    exit 1
                fi
            '''
        }
    }
}
