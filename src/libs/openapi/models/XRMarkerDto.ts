/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type XRMarkerDto = {
    appId: string;
    /**
     * Reference to the authenticated client the request originated from
     */
    clientId?: string;
    /**
     * ID of the marker
     */
    markerId?: string;
    /**
     * Refer to URI as decoded from the marker QR code
     */
    uri: string;
    /**
     * A list of tags for the marker
     */
    tags: Array<string>;
};

