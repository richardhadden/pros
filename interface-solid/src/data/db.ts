import { createLocalStorage } from '@solid-primitives/storage';
import { Dexie } from "dexie";

const db = new Dexie("ProsDB");
const [dbRequests, setDbRequests, {
    remove,
    clear,
    toJSON,
  }] = createLocalStorage();

export { db, dbRequests, setDbRequests };

