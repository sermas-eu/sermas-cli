/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionStorageResponseDto = {
    appId: string;
    /**
     * Reference to the authenticated client the request originated from
     */
    clientId?: string;
    userId: string;
    sessionId: string;
    data: Record<string, any>;
    storageId: string;
};

