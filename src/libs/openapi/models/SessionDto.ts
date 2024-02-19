/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionDto = {
    appId: string;
    /**
     * Reference to the authenticated client the request originated from
     */
    clientId?: string;
    sessionId?: string;
    /**
     * Agent instance associated to the session
     */
    agentId?: string;
    /**
     * Collect inferred identifiers of user interacting with the agent during a session.
     */
    user?: Array<string>;
    modifiedAt: string;
    createdAt: string;
    closedAt: string;
};

