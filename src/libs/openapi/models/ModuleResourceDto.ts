/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ModuleResourceDto = {
    /**
     * Resource of the module operation
     */
    resource: string;
    /**
     * Scope of the module operation
     */
    scope: string;
    /**
     * Additional context, added to the request and event topic when triggered. Can contain variable substituted from the  payload, such as :appId
     */
    context?: Array<string>;
    /**
     * Name of the module operation
     */
    name?: string;
    /**
     * Description of the module operation
     */
    description?: string;
    /**
     * Unique identifier of the module
     */
    moduleId: string;
    /**
     * Operation to call from the module OpenAPI spec
     */
    operationId: string;
    /**
     * Indicate if an event should be emitted when this module resource is triggered. The format is app/:appId/<resource>/<scope>/[...context]
     */
    emitEvent?: boolean;
};

