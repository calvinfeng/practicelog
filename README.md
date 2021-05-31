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

## Deployment on Elastic Beanstalk

Create a zip using `git`,

```bash
git archive -v -o practicelog-v2021-01-01.zip --format=zip HEAD
```

Then upload it to Elastic Beanstalk. It's better to use `-` instead of `.` because `.` is a HTTP URL reserved keyword.

### Connect to DB

```bash
psql -h ebdb.cjtqga7l9c3u.us-west-2.rds.amazonaws.com -p 5432 -U postgres
```

Then enter password

### Migrate

```bash
practicelog --config=production db reset
practicelog --config=production db migrate
practicelog --config=production db seed
```

## Deployment on Heroku

Create a new branch and switch to that branch

```bash
git branch main
git checkout main
```

Build the UI code

```bash
cd practicelogui
npm run build
```

Test the deployment locally

```bash
go build -o bin/practicelog -v .
heroku local
```

Package everything and commit

```bash
go mod tidy
go mod vendor
git add -A
git commit -m "..."
git push heroku main
```

Don't push it to GitHub because it's too big.

### Check DB Connection Credentials

```bash
heroku config
```

Then use the connection URL and `psql` into it directly.

```bash
psql <connection URL>
```
