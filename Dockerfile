FROM golang:1.14.1-alpine as gobuild
WORKDIR /go/src/practicelog
COPY . .

# Build Go
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64
RUN go build -a -tags netgo -ldflags '-w' -o plog .

FROM node:12 as nodebuild
WORKDIR /home/node/practicelogui
COPY ./practicelogui .

# Build JavaScripts
RUN npm install
RUN npm rebuild node-sass
RUN npm run build

FROM alpine:3.7 as deploy
EXPOSE 8080

RUN mkdir p /var/log/practicelog
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

# Copy binary, static files, & SQL database
WORKDIR /go/bin
COPY --from=gobuild /go/src/practicelog/plog .
COPY --from=gobuild /go/src/practicelog/conf ./conf
COPY --from=nodebuild /home/node/practicelogui/build ./practicelogui/build

CMD ["./plog", "--config", "production", "serve"]