

export function _get_plural_display_name(schema, entity) {

    const plural = schema[entity]?.meta?.display_name_plural;

    if (plural) {
        return plural
    }
    return schema[entity]?.meta?.display_name + 's';
}

export function _get_display_name(schema, entity) {
    return schema[entity]?.meta?.display_name;
}

export function _is_abstract(schema, entity) {
    return schema[entity]?.meta.abstract;
}