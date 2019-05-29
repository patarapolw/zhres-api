# zhres - Chinese Resource API

- Sentence segmentation via <https://github.com/fxsjy/jieba>
- Word frequencies via <https://pypi.org/project/wordfreq/>
- Vocabularies via <https://www.mdbg.net>
- Sentences via <https://tatoeba.org>

## POST `/api/zh/vocab`

Example request

```js
{
    "entry": "好",
    // "offset": 0
    // "limit": 10
}
```

Example response (result is sorted by word frequency)

```js
{
    "count": 280,
    "limit": 10,
    "offset": 0,
    "result": [
        {
            "english": "good/well/proper/good to/easy to/very/so/(suffix indicating completion or readiness)/(of two people) close/on intimate terms/(after a personal pronoun) hello",
            "id": 28068,
            "pinyin": "hao3",
            "simplified": "好",
            "traditional": null
        },
        {
            "english": "to be fond of/to have a tendency to/to be prone to",
            "id": 28069,
            "pinyin": "hao4",
            "simplified": "好",
            "traditional": null
        },
        {
            "english": "luckily/fortunately",
            "id": 28103,
            "pinyin": "hao3 zai4",
            "simplified": "好在",
            "traditional": null
        },
        {
            "english": "to become reconciled/on good terms with each other",
            "id": 19792,
            "pinyin": "he2 hao3",
            "simplified": "和好",
            "traditional": null
        },
        ...
    ]
}
```

## POST `/api/zh/vocab/match`

Example request

```js
{
	"entry": "好"
}
```

Example response

```js
{
    "result": [
        {
            "english": "good/well/proper/good to/easy to/very/so/(suffix indicating completion or readiness)/(of two people) close/on intimate terms/(after a personal pronoun) hello",
            "id": 28068,
            "pinyin": "hao3",
            "simplified": "好",
            "traditional": null
        },
        {
            "english": "to be fond of/to have a tendency to/to be prone to",
            "id": 28069,
            "pinyin": "hao4",
            "simplified": "好",
            "traditional": null
        }
    ]
}
```

## POST `/api/zh/sentence`

Example request

```js
{
    "entry": "好",
    // "offset": 0,
    // "limit": 10
}
```

Example response

```js
{
    "count": 1900,
    "limit": 10,
    "offset": 0,
    "result": [
        {
            "chinese": "我好胖哦。",
            "english": "I'm so fat.",
            "id": 21,
            "pinyin": "wǒ hǎo pàng ó"
        },
        {
            "chinese": "我不知道應該說什麼才好。",
            "english": "I'm at a loss for words.",
            "id": 59,
            "pinyin": "wǒ bù zhī dào yīng gāi shuō shén me cái hǎo"
        },
        ...
    ]
}
```

## POST `/api/vocab/radical`

Example request

```js
{
	"entry": "好"
}
```

Example response

```js
{
    "entry": "好",
    "frequency": 1620,
    "hlevel": 2,
    "id": 3546,
    "sub": "女子",
    "sup": "孬恏䒵",
    "tag": "HSK1",
    "var": ""
}
```

## POST `/api/lib/wordfreq`

Example request

```js
{
	"entry": "好"
}
```

Example response

```js
{
    "frequency": 1620
}
```

## POST `/api/lib/jieba`

Example request

```js
{
	"entry": "我不知道應該說什麼才好。"
}
```

Example response

```js
{
    "result": [
        "我",
        "不",
        "知道",
        "應該",
        "說",
        "什麼",
        "才",
        "好",
        "。"
    ]
}
```

## POST `/api/jieba/cutForSearch`

Example request

```js
{
	"entry": "我不知道應該說什麼才好。"
}
```

Example response

```js
{
    "result": [
        "我",
        "不",
        "知道",
        "應該",
        "說",
        "什麼",
        "才",
        "好",
        "。"
    ]
}
```
