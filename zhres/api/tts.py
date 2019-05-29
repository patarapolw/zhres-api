from gtts import gTTS
import uuid

from flask import request, Blueprint, send_from_directory

api_tts = Blueprint("tts", __name__, url_prefix="/api/tts")

@api_tts.route("/")
def r_tts():
    tts = gTTS(request.args["q"], lang=request.args.get("lang", "zh-cn"))
    filename = f"tmp/{str(uuid.uuid4())[:8]}.mp3"
    tts.save(filename)

    return send_from_directory("..", filename)
