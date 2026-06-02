pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {

        stage('Clone') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/yourusername/realtime-chat-app.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    pkill -f "node server.js" || true
                    sleep 1
                    nohup node server.js > app.log 2>&1 &
                    sleep 2
                    curl -f http://localhost:3000/health && echo "App is up!"
                '''
            }
        }
    }

    post {
        success {
            echo "Chat app deployed! Running on port 3000. Build #${BUILD_NUMBER}"
        }
        failure {
            echo "Build failed! Check logs."
            sh 'cat app.log || true'
        }
    }
}
