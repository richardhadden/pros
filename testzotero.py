import requests

conf = {
    "type": "zotero",  # or zotero
    "url": "https://api.zotero.org",  # url of the bibsonomy instance or zotero.org
    "user": "oculardexterity",  # for zotero use the user id number found in settings
    "API key": "",
    "group": "2556736",
}

q = "AT-oest"

if "group" in conf.keys():
    add = f"groups/{conf['group']}"
else:
    add = f"users/{conf['user']}"
url = f"https://api.zotero.org/{add}/items"
headers = {"Zotero-API-Key": conf["API key"], "Zotero-API-Version": "3"}
params = {
    "q": q,
    "qmode": "titleCreatorYear",
    "include": "csljson,data",
    "start": 0,
    "limit": 0,
}
res = requests.get(url, headers=headers, params=params)

data = res.json()

from icecream import ic

ic(data[0]["data"])
