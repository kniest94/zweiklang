"""Read-only HTML fixture parser using only Python's standard library."""
import json
import sys
from html.parser import HTMLParser


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = {"tag": "document", "attrs": {}, "childNodes": []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = {"nodeType": 1, "tag": tag, "attrs": dict(attrs), "childNodes": []}
        self.stack[-1]["childNodes"].append(node)
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        self.stack[-1]["childNodes"].append({"nodeType": 3, "nodeValue": data})


parser = Tree()
parser.feed(sys.stdin.read())
print(json.dumps(parser.root, ensure_ascii=False))
