/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AppClientDto = {
    appId?: string;
    name: string;
    /**
     * The clientId, must be unique in the client list and in uuid format.
     */
    clientId?: string;
    secret?: string;
    /**
     * A list of permissions for this client in the form [resource].[scope] e.g. detection.intent. User *.* for all permission
     */
    permissions: Array<string>;
};

