import { writable } from 'svelte/store';


const BASE_URI = 'http://127.0.0.1:8000/api';

export const schema = writable({});

export const get_schema = async(path) => {
    const res = await fetch(BASE_URI + "/schema");
    const json = await res.json();
    console.log("get_schema_json", json)
    schema.set(json);
};