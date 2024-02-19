/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AgentHeartBeatEventDto = {
    appId: string;
    /**
     * Reference to the authenticated client the request originated from
     */
    clientId?: string;
    moduleId: string;
    status: AgentHeartBeatEventDto.status;
};
export namespace AgentHeartBeatEventDto {
    export enum status {
        '_-3000' = -3000,
        '_-2000' = -2000,
        '_-1000' = -1000,
        '_1000' = 1000,
        '_2000' = 2000,
        '_3000' = 3000,
        '_4000' = 4000,
        '_5000' = 5000,
    }
}

