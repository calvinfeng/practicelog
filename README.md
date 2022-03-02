# Practice Log

[![CircleCI](https://circleci.com/gh/calvinfeng/practicelog/tree/circleci-project-setup.svg?style=svg&circle-token=5791ef5903afb3e828db533a44c388edf146e410)](https://circleci.com/gh/calvinfeng/practicelog/tree/circleci-project-setup)

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

## Heroku

### Setup

Heroku CLI creates git remote named `heroku` automatically. It also lets Heroku to auto detect app name.

> App commands are typically executed from within an app’s local git clone. The app name is automatically detected by
> scanning the git remotes for the current working copy

```sh
heroku git:remote -a guitar-practice-log
```

### Deploy

Create a new branch and switch to that branch

```shell
git branch main
git checkout main
```

Build the UI code

```shell
cd practicelogui
npm run build
```

Test the deployment locally

```shell
go build -o bin/practicelog -v .
heroku local
```

Package everything and commit

```shell
go mod tidy
go mod vendor
git add -A
git commit -m "..."
git push heroku main
```

Don't push it to GitHub because it's too big.

### Check DB Connection Credentials

```shell
heroku config
```

Then use the connection URL and `psql` into it directly.

```shell
psql <connection URL>
```
