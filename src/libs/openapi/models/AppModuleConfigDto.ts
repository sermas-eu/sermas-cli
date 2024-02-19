/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModuleSettingsDto } from './ModuleSettingsDto';
export type AppModuleConfigDto = {
    moduleId: string;
    /**
     * Status of the module. `enabled` by default. can be `disabled`. Set to `failure` if loading generates errors.
     */
    status?: string;
    name?: string;
    description?: string;
    supports: Array<string>;
    config: ModuleSettingsDto;
    appId?: string;
};

