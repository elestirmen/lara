# Lara'nın Dünyası seslendirme servisi: Piper (açık kaynak sinirsel ses) + Türkçe model.
FROM python:3.12-slim
RUN pip install --no-cache-dir piper-tts==1.8.0 lameenc==1.9.0
ADD --chmod=644 https://huggingface.co/rhasspy/piper-voices/resolve/main/tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx /voices/tr_TR-dfki-medium.onnx
ADD --chmod=644 https://huggingface.co/rhasspy/piper-voices/resolve/main/tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx.json /voices/tr_TR-dfki-medium.onnx.json
RUN chmod 755 /voices && mkdir /cache && chown 65534:65534 /cache
COPY tts/server.py /app/server.py
USER 65534:65534
ENV PYTHONUNBUFFERED=1
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8090/saglik',timeout=3)" || exit 1
CMD ["python","/app/server.py"]
