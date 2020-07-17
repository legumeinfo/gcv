FROM python:3.8.4-alpine3.12 AS dev

# easier to install psycopg2 via package
RUN apk add --no-cache py3-psycopg2
ENV PYTHONPATH=/usr/lib/python3.8/site-packages

WORKDIR /app

COPY requirements.txt .

RUN grep -v '^psycopg2' requirements.txt | pip3 install --no-cache-dir -r /dev/stdin

ENV PYTHONUNBUFFERED=1

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
EXPOSE 8000

########################################

FROM dev AS prod

RUN pip install --no-cache-dir gunicorn==20.0.4

COPY . .

USER daemon
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "server.wsgi"]
