FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app

COPY words.txt ./words.txt

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
