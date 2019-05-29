from flask import Flask, redirect
from flask_cors import CORS

from .api.lib import api_lib
from .api.zh import api_zh
from .api.tts import api_tts

app = Flask(__name__, static_folder="dist")
CORS(app)

app.register_blueprint(api_lib)
app.register_blueprint(api_zh)
app.register_blueprint(api_tts)

@app.route("/")
def index():
    return redirect("https://github.com/patarapolw/zhres")
