/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorizationUser } from './AuthorizationUser';
export type UpdateUserRequestDto = {
    appId: string;
    /**
     * Reference to the authenticated client the request originated from
     */
    clientId?: string;
    userId: string;
    password?: string;
    roles?: string;
    enabled?: boolean;
    authorization?: Array<AuthorizationUser>;
};

