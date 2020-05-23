FROM alpine:3.11

RUN apk add --no-cache \
  python3 \
  py3-gunicorn \
  py3-psycopg2

COPY ./requirements.txt /tmp

RUN grep -v '^psycopg2' /tmp/requirements.txt > /tmp/requirements-mod.txt \
  && pip3 install --no-cache-dir -r /tmp/requirements-mod.txt

WORKDIR /app

COPY . .

ENV PYTHONUNBUFFERED=1
USER daemon

EXPOSE 8000

# development
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
