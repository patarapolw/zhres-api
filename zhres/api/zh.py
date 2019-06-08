from flask import request, jsonify, Blueprint

from ..lib.zh import vocab, vocab_match, sentence, radical

api_zh = Blueprint("zh", __name__, url_prefix="/api/zh")


@api_zh.route("/vocab", methods=["POST"])
def r_vocab():
    entry = request.json["entry"]
    result = vocab(entry)
    offset = request.json.get("offset", 0)
    limit = request.json.get("limit", 10)

    return jsonify({
        "result": result,
        "count": len(result),
        "offset": offset,
        "limit": limit
    })


@api_zh.route("/vocab/match", methods=["POST"])
def r_vocab_match():
    entry = request.json["entry"]
    result = vocab_match(entry)

    return jsonify({
        "result": result
    })


@api_zh.route("/sentence", methods=["POST"])
def r_sentence():
    entry = request.json["entry"]
    result = sentence(entry)
    offset = request.json.get("offset", 0)
    limit = request.json.get("limit", 10)

    return jsonify({
        "result": result,
        "count": len(result),
        "offset": offset,
        "limit": limit
    })


@api_zh.route("/radical", methods=["POST"])
def r_radical():
    entry = request.json["entry"]
    return radical(entry)
