const data = {
    "key1": [{
        "key2": "value"
    }]
}


const nested_get = (nested, keys) => {

    const k = keys.shift();
    if (keys.length > 0) {
        if (nested.constructor === Array) {
            return nested_get(nested[0][k], keys)
        }
        return nested_get(nested[k], keys)
    } else {
        if (nested.constructor === Array) {
            return nested[0][k]
        }
        return nested[k]
    }
}

//console.log(nested_get(data, ["key1", "key2"]))

const re = new RegExp('(\{.*?\})', 'g');
let s = "{is_about_person.label} named    ff {title} {first_name} {last_name}"



console.log([...s.matchAll(re)])

const matches = [...s.matchAll(re)];
matches.forEach(match => {
    s = s.replace(new RegExp(match[0]), "BALLS")
});
s = s.replace(/\s\s+/g, ' ');
console.log(s)