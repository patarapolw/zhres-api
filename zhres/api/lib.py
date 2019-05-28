from wordfreq import word_frequency
import jieba

from flask import request, jsonify, Blueprint

api_lib = Blueprint("lib", __name__, url_prefix="/api/lib")

@api_lib.route("/wordfreq", methods=["POST"])
def r_wordfreq():
    entry = request.json["entry"]

    return jsonify({
        "frequency": word_frequency(entry, "zh") * 10**6
    })

@api_lib.route("/jieba", methods=["POST"])
def r_jieba():
    entry = request.json["entry"]

    return jsonify({
        "result": list(jieba.cut(entry))
    })

@api_lib.route("/jieba/cutForSearch", methods=["POST"])
def r_jieba_search():
    entry = request.json["entry"]

    return jsonify({
        "result": list(jieba.cut_for_search(entry))
    })
