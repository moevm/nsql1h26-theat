FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY init_db.py .

CMD ["python", "-u", "init_db.py"]
