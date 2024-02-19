/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionStorageSearchDto = {
    appId: string;
    /**
     * Reference to the authenticated client the request originated from
     */
    clientId?: string;
    userId: Array<string>;
    sessionId: Array<string>;
    storageId: Array<string>;
};

