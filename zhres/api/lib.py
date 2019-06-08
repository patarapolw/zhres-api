from wordfreq import word_frequency
import jieba
import pinyin
from hyperpython import h

from flask import request, jsonify, Blueprint

from ..lib.zh import ruby_ify

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


@api_lib.route("/pinyin", methods=["POST"])
def r_pinyin():
    entry = request.json["entry"]

    return jsonify({
        "result": pinyin.get(entry, delimiter=request.json.get("limiter", " "))
    })


@api_lib.route("/pinyin/ruby", methods=["POST"])
def r_pinyin_ruby():
    entry = request.json["entry"]

    return jsonify({
        "result": str(h("span", list(ruby_ify(entry))))
    })
