# Practice Log

## Usage

```bash
go install
practicelog db reset
practicelog db migrate
practicelog db seed
```

```bash
practicelog practiced "<label name>"
```

## Docker

Build it

```bash
docker build -t practicelog .
```

Run it

```bash
docker run --rm -p 8080:8080 practicelog
```

## Deployment

Create a zip using `git`,

```bash
git archive -v -o practicelog-v2020.12.27.zip --format=zip HEAD
```

Then upload it to Elastic Beanstalk.

## Connect to DB

```bash
psql -h ebdb.cjtqga7l9c3u.us-west-2.rds.amazonaws.com -p 5432 -U postgres
```

Then enter password
