import { groupBy } from "ramda";

const requiredFieldFromErrorMessageRegex = /^Instance does not have required property \"(.*)\".$/g;

const get_error_field = (err) => {
   
    const loc = err.instanceLocation;
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
    //console.log("ERRORS", v);
    const errors = groupByField(v.errors.map(i => ({...i, errorField: get_error_field(i)})).filter(i => i.errorField));
    
    return errors;

};

export const unpackInlineErrors = (errs) => {
    if (errs) {
        const errors = groupByField(errs.filter(err => err.instanceLocation.split("/").length > 2 && err.instanceLocation.split("/")[2] !== "type").map(err => ({...err, errorField: err.instanceLocation.split("/")[2] })));
        console.log(errors)
        return errors;
    }
    else return {}
}