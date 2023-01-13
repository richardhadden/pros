import { groupBy } from "ramda";

const get_error_field = (loc) => {
    console.log(loc.split("/"))
    const parts = loc.split("/");
    const root = parts[0];
    if (parts.length > 1) {
        const field = parts[1];
        return field;
    }
    return undefined;
}

const groupByField = groupBy(i => i.errorField)

export const unpackValidationErrors = (v) => {
    console.log(v);
    const errors = groupByField(v.errors.map(i => ({...i, errorField: get_error_field(i.instanceLocation)})).filter(i => i.errorField));
    return errors;

};