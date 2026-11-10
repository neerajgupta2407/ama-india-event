.PHONY: install migrate makemigrations test lint format dev

install:
	pip install -r requirements/dev.txt

migrate:
	python manage.py migrate

makemigrations:
	python manage.py makemigrations

test:
	python manage.py test

lint:
	ruff check .
	black --check .
	isort --check-only .

format:
	black .
	isort .

dev:
	python manage.py runserver
