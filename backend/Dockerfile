FROM python:3.11-slim

WORKDIR /app

# Oprava: explicitne inštaluj netcat-openbsd
RUN apt-get update && apt-get install -y netcat-openbsd && apt-get clean

COPY ./backend /app
COPY ./backend/requirements.txt .
COPY ./wait-for-it.sh /app/wait-for-it.sh
COPY backend/.env .env


RUN chmod +x /app/wait-for-it.sh
RUN pip install --no-cache-dir -r requirements.txt

CMD ["sh", "-c", "./wait-for-it.sh db:3306 -- uvicorn main:app --host 0.0.0.0 --port 8000"]
