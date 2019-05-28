from flask import Flask
from flask_cors import CORS

from .api.lib import api_lib
from .api.zh import api_zh

app = Flask(__name__)
CORS(app)

app.register_blueprint(api_lib)
app.register_blueprint(api_zh)
