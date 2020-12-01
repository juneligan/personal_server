ENVFILE ?= .env.example

.env:
	cp .env.example .env

.PHONY: envfile
envfile:
	cp $(ENVFILE) .env

.PHONY: herokuLogin
herokuLogin:
	heroku login
	heroku container:login

.PHONY: deploy
deploy:
	heroku git:remote -a personal-server-api
	heroku container:push web -a personal-server-api
	heroku container:release web

.PHONY: build
build:
	docker build -t personal-server . -f Dockerfile
	$(MAKE) prune

.PHONY: run
run: envfile
	docker run --rm --detach --network=host --env-file .env --name personal-server-container personal-server

.PHONY: log
log:
	docker logs -f personal-server-container

.PHONY: start
start:
	$(MAKE) build
	$(MAKE) run
	$(MAKE) log

.PHONY: installDependencies
installDependencies:
	npm install @feathersjs/cli -g
	sudo snap install --classic heroku

.PHONY: stop
stop:
	docker stop personal-server-container
	$(MAKE) prune

.PHONY: prune
prune:
	docker image prune -f

.PHONY: restart
restart:
	$(MAKE) stop
	$(MAKE) start
