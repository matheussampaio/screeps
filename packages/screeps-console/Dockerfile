FROM python:3.7-alpine

WORKDIR /opt/app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY src/ src/

CMD [ "python", "./src/console.py" ]
