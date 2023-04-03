import dataRequest from '../../interface/src/data/dataFunctions';
import { schema } from '../../interface/src/index';

export type ImportListData = Array<{
        uri: string,
        id: string,
        label: string,
        label_extra: string,
        already_in_db: boolean
    }>


export type ImportListResponse = {
    data: ImportListData,
    totalItems: number

}

export async function getImportList(
    entity_type: string,
    endpoint_slug: string,
    q: string,
): Promise<ImportListResponse> {
    const response_json = await dataRequest(
        `import/${schema[entity_type].app}/${entity_type}/${endpoint_slug}/?q=${q}`
    );
    console.log("import data", response_json)
    return response_json as ImportListResponse;
}

export type ImportedNewDataReturnType = {
    uid: string, 
    label: string, 
    real_type: string
}[];


export async function createImports(
    entity_type: string,
    endpoint_slug: string,
    item_identifiers: string[]
): Promise<ImportedNewDataReturnType> {
    const response_json = await dataRequest(
        `import/${schema[entity_type].app}/${entity_type}/${endpoint_slug}/`,
        "POST",
        item_identifiers
    );
 
    return response_json as ImportedNewDataReturnType;
}