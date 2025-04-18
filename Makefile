.PHONY: build docker_build docker_all up down clean

SHELL:=/bin/sh
PROJECT_NAME := echohush
DATETIME = $(shell date '+%Y%m%d_%H%M%S')

# Path Related
MKFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
MKFILE_DIR := $(dir $(MKFILE_PATH))
RELEASE_DIR := ${MKFILE_DIR}bin
ENV=dev

ifndef GIT_COMMIT
  GIT_COMMIT := git-$(shell git rev-parse --short HEAD)
endif

GIT_REPO_INFO=$(shell git config --get remote.origin.url)

VERSION_TAG=$(shell git describe --tags `git rev-list --tags --max-count=1`)

# Build Flags
GO_LD_FLAGS= "-X ${PROJECT_NAME}/pkg/daemon.RELEASE=${VERSION_TAG} 	\
			  -X ${PROJECT_NAME}/pkg/daemon.COMMIT=${GIT_COMMIT} \
			  -X ${PROJECT_NAME}/pkg/daemon.REPO=${GIT_REPO_INFO} \
			  -X ${PROJECT_NAME}/pkg/daemon.BUILDTIME=${DATETIME} \
			  -X ${PROJECT_NAME}/pkg/daemon.SERVICENAME=${PROJECT_NAME} \
			  -X ${PROJECT_NAME}/pkg/daemon.ENV=${ENV} \
			  -X ${PROJECT_NAME}/pkg/daemon.TAG=${VERSION_TAG}"

CGO_SWITCH := 1

run: ENV = dev
run: 
	CGO_ENABLED=${CGO_SWITCH} wails dev -tags fts5 -ldflags ${GO_LD_FLAGS} 

production: ENV = production
production:
	CGO_ENABLED=${CGO_SWITCH} wails build -tags fts5,desktop,production -ldflags ${GO_LD_FLAGS} -o echohush 

clean:
	@rm -f ${MKFILE_DIR}bin/${PROJECT_NAME}
	@rm -f ${MKFILE_DIR}bin/${PROJECT_NAME}.db
	@rm -f ${MKFILE_DIR}/.${PROJECT_NAME}/${PROJECT_NAME}.db
	@rm -f ${MKFILE_DIR}bin/*

db_clean:
	@rm bin/${PROJECT_NAME}.db

ui:
	go run cmd/ui/*.go

sqlc:
	sqlc generate

db_gen: sqlc
	rm internal/db/query.gen.go || true
	go run cmd/gencall/main.go > 11
	mv 11 internal/db/query.gen.go
