import requests
import xlsxwriter

from zhres.lib.zh import vocab_match

vs = """
几乎
干净
信用卡
腿
行李箱
结束
照顾
其实
周末
成绩
""".strip().split("\n")

wb = xlsxwriter.Workbook("flash.xlsx")
ws = wb.add_worksheet()
row = 0

for v in vs:
    m = vocab_match(v)[0]
    ws.write_row(row, 2, [m["english"], m["pinyin"], m["simplified"]])
    row += 1

wb.close()
