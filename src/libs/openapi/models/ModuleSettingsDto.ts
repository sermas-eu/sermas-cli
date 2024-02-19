/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModuleResourceDto } from './ModuleResourceDto';
export type ModuleSettingsDto = {
    /**
     * Service URL used to load .well-known
     */
    url?: string;
    /**
     * Reference to a openapi specification to use to map requests to the modules
     */
    openapiSpec: string;
    /**
     * Reference to a asyncAPI specification to use to map requests to the modules
     */
    asyncapiSpec: string;
    /**
     * List of managed resources and scopes for this module
     */
    resources: Array<ModuleResourceDto>;
};

