# Dockerize Chat Example App

## build docker image
docker build -t chat-server -f examples/chat/docker/Dockerfile .

## run docker app
docker run -p 3000:3000 -d --rm -name chat-server chat-server:latest

## browser test
Open browser and enter the following URL in the browser: http://localhost:3000/client

## stop docker
docker stop chat-server
