/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppClientDto } from './AppClientDto';
import type { AppModuleConfigDto } from './AppModuleConfigDto';
import type { AppSettingsDto } from './AppSettingsDto';
import type { RepositoryConfigDto } from './RepositoryConfigDto';
export type CreatePlatformAppDto = {
    public?: boolean;
    name: string;
    description: string;
    /**
     * Owner of the application
     */
    ownerId: string;
    modules: Array<AppModuleConfigDto>;
    repository: RepositoryConfigDto;
    clients: Array<AppClientDto>;
    settings?: AppSettingsDto;
};

