import sqlite3
from wordfreq import word_frequency

from flask import request, jsonify, Blueprint

zh = sqlite3.connect("asset/zh.db", check_same_thread=False)
zh.row_factory = sqlite3.Row
api_zh = Blueprint("zh", __name__, url_prefix="/api/zh")

@api_zh.route("/vocab", methods=["POST"])
def r_vocab():
    entry = request.json["entry"]
    c = zh.execute("""
    SELECT * FROM vocab 
    WHERE
        simplified LIKE ? OR
        traditional LIKE ?
    """, (f"%{entry}%", f"%{entry}%"))

    result = sorted((dict(x) for x in c.fetchall()), key=lambda x: -word_frequency(x["simplified"], "zh"))
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
    c = zh.execute("""
    SELECT * FROM vocab 
    WHERE
        simplified = ? OR
        traditional = ?
    """, (entry, entry))

    return jsonify({
        "result": [dict(x) for x in c.fetchall()]
    })

@api_zh.route("/sentence", methods=["POST"])
def r_sentence():
    entry = request.json["entry"]
    c = zh.execute("""
    SELECT * FROM sentence 
    WHERE
        chinese LIKE ?
    """, (f"%{entry}%",))

    result = [dict(x) for x in c.fetchall()]
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
    if len(entry) == 1:
        c = zh.execute("""
        SELECT * FROM token 
        WHERE
            entry = ?
        """, (entry,))
        return jsonify(dict(c.fetchone())) 
