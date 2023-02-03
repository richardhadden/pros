import { schema } from '../index';

const getEntityNamePlural: (entity_name: string) => string = (entity_name) => {
    const e = schema[entity_name];
    if (e) {
        if (e.meta.display_name_plural) {
            return e.meta.display_name_plural;
        }
        else {
            return e.meta.display_name + 's';
        }
    }
    return entity_name;
}

const getEntityDisplayName: (entity_name: string) => string = (entity_name) => {
    try {const e = schema[entity_name.toLowerCase()];
    if (e) {
        if (e.meta.display_name) {
            return e.meta.display_name;
        }
    }

    return entity_name;
}
catch {
    return "MISSING"
}
   
}

export { getEntityNamePlural, getEntityDisplayName };
