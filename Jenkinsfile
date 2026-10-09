pipeline {

    agent any

    parameters {

        choice(
            name: 'STAGING_HEALTH_STATUS',
            choices: ['healthy', 'unhealthy'],
            description: 'Health status for staging deployment'
        )

        choice(
            name: 'PRODUCTION_HEALTH_STATUS',
            choices: ['healthy', 'unhealthy'],
            description: 'Health status for production deployment'
        )
    }

    stages {

        /*
         * =========================================================
         * 1. CHECKOUT
         * =========================================================
         */
        stage('Checkout') {
            steps {

                git branch: 'main',
                    url: 'https://github.com/kolasurendra/cicd-staging-rollback.git'
            }
        }


        /*
         * =========================================================
         * 2. APPLICATION CHECK
         * =========================================================
         */
        stage('Application Check') {
            steps {

                sh '''
                    echo "Checking application files..."

                    ls -la

                    echo "Application files checked successfully."
                '''
            }
        }


        /*
         * =========================================================
         * 3. BUILD DOCKER IMAGE
         * =========================================================
         */
        stage('Docker Build') {
            steps {

                sh '''
                    echo "Building Docker image..."

                    docker build \
                        -t cicd-app:${BUILD_NUMBER} .

                    echo "Docker image created:"
                    docker images cicd-app
                '''
            }
        }


        /*
         * =========================================================
         * 4. DEPLOY TO STAGING
         * =========================================================
         */
        stage('Deploy to Staging') {
            steps {

                sh '''
                    echo "======================================"
                    echo "DEPLOYING TO STAGING"
                    echo "======================================"

                    docker stop cicd-app-staging || true
                    docker rm cicd-app-staging || true

                    docker run -d \
                        --name cicd-app-staging \
                        -p 8081:3000 \
                        -e HEALTH_STATUS=${STAGING_HEALTH_STATUS} \
                        cicd-app:${BUILD_NUMBER}

                    echo "Staging container started."

                    docker ps --filter name=cicd-app-staging
                '''
            }
        }


        /*
         * =========================================================
         * 5. STAGING HEALTH CHECK
         * =========================================================
         */
        stage('Health Check - Staging') {
            steps {

                sh '''
                    echo "======================================"
                    echo "CHECKING STAGING HEALTH"
                    echo "======================================"

                    for i in {1..10}
                    do

                        echo "Health check attempt: $i"

                        if curl -f http://localhost:8081/health
                        then
                            echo ""
                            echo "STAGING HEALTH CHECK PASSED"
                            exit 0
                        fi

                        echo "Staging health check failed."
                        echo "Retrying in 5 seconds..."

                        sleep 5

                    done

                    echo ""
                    echo "STAGING HEALTH CHECK FAILED"

                    exit 1
                '''
            }
        }


        /*
         * =========================================================
         * 6. SAVE CURRENT PRODUCTION VERSION
         * =========================================================
         */
        stage('Save Previous Production Version') {
            steps {

                sh '''
                    echo "======================================"
                    echo "SAVING CURRENT PRODUCTION VERSION"
                    echo "======================================"

                    if [ -f /opt/cicd/production-version.txt ]
                    then

                        CURRENT_VERSION=$(cat /opt/cicd/production-version.txt)

                        echo "Current production version:"
                        echo "${CURRENT_VERSION}"

                        echo "${CURRENT_VERSION}" \
                            > /opt/cicd/previous-production-version.txt

                        echo "Previous production version saved."

                    else

                        echo "ERROR:"
                        echo "/opt/cicd/production-version.txt does not exist."

                        exit 1

                    fi
                '''
            }
        }


        /*
         * =========================================================
         * 7. DEPLOY TO PRODUCTION
         * =========================================================
         */
        stage('Deploy to Production') {
            steps {

                sh '''
                    echo "======================================"
                    echo "DEPLOYING TO PRODUCTION"
                    echo "======================================"

                    docker stop cicd-app-production || true
                    docker rm cicd-app-production || true

                    docker run -d \
                        --name cicd-app-production \
                        -p 8088:3000 \
                        -e HEALTH_STATUS=${PRODUCTION_HEALTH_STATUS} \
                        cicd-app:${BUILD_NUMBER}

                    echo "Production container started."

                    docker ps --filter name=cicd-app-production
                '''
            }
        }


        /*
         * =========================================================
         * 8. PRODUCTION HEALTH CHECK
         * =========================================================
         */
        stage('Health Check - Production') {
            steps {

                sh '''
                    echo "======================================"
                    echo "CHECKING PRODUCTION HEALTH"
                    echo "======================================"

                    for i in {1..10}
                    do

                        echo "Health check attempt: $i"

                        if curl -f http://localhost:8088/health
                        then
                            echo ""
                            echo "PRODUCTION HEALTH CHECK PASSED"
                            exit 0
                        fi

                        echo "Production health check failed."
                        echo "Retrying in 5 seconds..."

                        sleep 5

                    done

                    echo ""
                    echo "PRODUCTION HEALTH CHECK FAILED"

                    exit 1
                '''
            }
        }


        /*
         * =========================================================
         * 9. RECORD SUCCESSFUL PRODUCTION VERSION
         * =========================================================
         */
        stage('Record Successful Production Version') {
            steps {

                sh '''
                    echo "======================================"
                    echo "RECORDING SUCCESSFUL VERSION"
                    echo "======================================"

                    echo "${BUILD_NUMBER}" \
                        > /opt/cicd/production-version.txt

                    echo "Production version is now:"
                    cat /opt/cicd/production-version.txt
                '''
            }
        }
    }


    /*
     * =============================================================
     * AUTOMATIC ROLLBACK
     * =============================================================
     *
     * This section executes when any stage fails.
     *
     * Example:
     *
     * Production v10
     *       ↓
     * Deploy v11
     *       ↓
     * Health Check FAILED
     *       ↓
     * post { failure }
     *       ↓
     * Rollback to v10
     *
     * =============================================================
     */

    post {

        failure {

            sh '''
                echo ""
                echo "=============================================="
                echo "       DEPLOYMENT FAILED"
                echo "       STARTING AUTOMATIC ROLLBACK"
                echo "=============================================="
                echo ""

                if [ ! -f /opt/cicd/previous-production-version.txt ]
                then

                    echo "ERROR:"
                    echo "Previous production version was not found."

                    exit 1

                fi


                PREVIOUS_VERSION=$(cat /opt/cicd/previous-production-version.txt)


                echo "Previous stable production version:"
                echo "${PREVIOUS_VERSION}"

                echo ""


                echo "Stopping failed production deployment..."

                docker stop cicd-app-production || true

                docker rm cicd-app-production || true


                echo ""
                echo "Starting previous production version..."

                docker run -d \
                    --name cicd-app-production \
                    -p 8088:3000 \
                    -e HEALTH_STATUS=healthy \
                    cicd-app:${PREVIOUS_VERSION}


                echo ""
                echo "Previous production version started."


                echo ""
                echo "Waiting for application to start..."

                sleep 5


                echo ""
                echo "======================================"
                echo "CHECKING ROLLBACK HEALTH"
                echo "======================================"


                for i in {1..10}
                do

                    echo "Rollback health check attempt: $i"

                    if curl -f http://localhost:8088/health
                    then

                        echo ""
                        echo "======================================"
                        echo "       ROLLBACK SUCCESSFUL"
                        echo "======================================"

                        echo ""
                        echo "Production restored to version:"
                        echo "${PREVIOUS_VERSION}"

                        echo ""

                        echo "${PREVIOUS_VERSION}" \
                            > /opt/cicd/production-version.txt

                        echo "Production version file updated."

                        exit 0

                    fi


                    echo "Rollback health check failed."
                    echo "Retrying in 5 seconds..."

                    sleep 5

                done


                echo ""
                echo "======================================"
                echo "       ROLLBACK FAILED"
                echo "======================================"

                exit 1
            '''
        }


        success {

            echo '======================================'
            echo '      DEPLOYMENT SUCCESSFUL'
            echo '======================================'
            echo "Production version: ${BUILD_NUMBER}"
        }
    }
}


