import sqlite3
from wordfreq import word_frequency
import jieba
import pinyin
from dominate.tags import ruby, rp, rt
import regex

zh = sqlite3.connect("asset/zh.db", check_same_thread=False)
zh.row_factory = sqlite3.Row


def vocab(entry: str):
    c = zh.execute("""
    SELECT * FROM vocab 
    WHERE
        simplified LIKE ? OR
        traditional LIKE ?
    """, (f"%{entry}%", f"%{entry}%"))

    return sorted((dict(x) for x in c.fetchall()), key=lambda x: -word_frequency(x["simplified"], "zh"))


def vocab_match(entry: str):
    c = zh.execute("""
    SELECT * FROM vocab 
    WHERE
        simplified = ? OR
        traditional = ?
    """, (entry, entry))

    return [dict(x) for x in c.fetchall()]


def sentence(entry: str):
    c = zh.execute("""
    SELECT * FROM sentence 
    WHERE
        chinese LIKE ?
    """, (f"%{entry}%",))

    return [dict(x) for x in c.fetchall()]


def radical(entry: str):
    assert len(entry) == 1
    
    c = zh.execute("""
    SELECT * FROM token 
    WHERE
        entry = ?
    """, (entry,))
    return dict(c.fetchone())


def ruby_ify(entry: str):
    for seg in jieba.cut(entry):
        if regex.search("\\p{IsHan}", seg):
            p = pinyin.get(seg)
            r = ruby()
            r += seg
            r += rp("(")
            r += rt(p)
            r += rp(")")
            yield r
        else:
            yield seg
