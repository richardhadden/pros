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
    const e = schema[entity_name];
    if (e) {
        if (e.meta.display_name) {
            return e.meta.display_name;
        }
    }

    const f = schema.META.inline_relation_definitions?.[entity_name]?.meta?.display_name;
    if (f) {
        return f;
    }
  
    return entity_name;
   
}

export { getEntityNamePlural, getEntityDisplayName };