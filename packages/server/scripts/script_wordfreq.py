import sys
from wordfreq import word_frequency
import json

for line in sys.stdin:
  c = json.loads(line.strip())
  print(json.dumps({
    "c": c,
    "f": word_frequency(c, "zh") * 10 ** 6
  }))
