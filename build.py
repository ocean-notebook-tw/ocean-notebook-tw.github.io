#!/usr/bin/env python3
"""把 src/ 裡的檔案組合成網站首頁 index.html。

用法：在專案資料夾執行  python3 build.py
（只需要 Python 3，不用安裝其他套件）
"""
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

# 單元檔案依順序載入；新增單元時，把檔名加在這裡，並到 src/site.js 的 UNITS 與 CATALOG 登記
UNIT_FILES = ["unit-1-1.js", "unit-2-1.js"]


def read(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def main() -> None:
    js = read("common.js") + read("art.js") + "\n"
    js += "".join(read(f) for f in UNIT_FILES)
    js += read("site.js")
    html = (
        read("head.html")
        + read("body.html")
        + '<script src="vendor/d3.min.js"></script>\n'
        + "<script>const LAND=" + read("land-110m.geojson").strip() + ";</script>\n"
        + "<script>\n" + js + "</script>\n"
    )
    page = (
        '<!doctype html>\n<html lang="zh-Hant-TW">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="description" content="依國家海洋研究院《海洋科學序列教材 G3–G5 初階海洋素養》設計的學生互動遊戲。">\n'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
        + html.replace("</style>", "</style>\n</head>\n<body>", 1)
        + "</body>\n</html>\n"
    )
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    print(f"已產生 index.html（{len(page.encode('utf-8')) // 1024} KB）")


if __name__ == "__main__":
    main()
