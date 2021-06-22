import sys
from wordfreq import word_frequency
import json

for line in sys.stdin:
  print(json.dumps({
    "c": line,
    "f": word_frequency(line, "zh") * 10 ** 6
  }))
