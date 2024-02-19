/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentHeartBeatEventDto } from '../models/AgentHeartBeatEventDto';
import type { SessionDto } from '../models/SessionDto';
import type { SessionStorageEventDto } from '../models/SessionStorageEventDto';
import type { SessionStorageRequestDto } from '../models/SessionStorageRequestDto';
import type { SessionStorageResponseDto } from '../models/SessionStorageResponseDto';
import type { SessionStorageSearchDto } from '../models/SessionStorageSearchDto';
import type { SessionSupportRequestDto } from '../models/SessionSupportRequestDto';
import type { SessionSupportResponseDto } from '../models/SessionSupportResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SessionService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param sessionId
     * @returns any
     * @throws ApiError
     */
    public sessionControllerRead(
        sessionId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/session/{sessionId}',
            path: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @param sessionId
     * @returns any
     * @throws ApiError
     */
    public sessionControllerDelete(
        sessionId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/session/{sessionId}',
            path: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public sessionControllerCreate(
        requestBody: SessionDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/session',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public sessionControllerUpdate(
        requestBody: SessionDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/session',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Notifies of an agent update
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public agentUpdate(
        requestBody: AgentHeartBeatEventDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/session/agent',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Store user or session related data
     * @param requestBody
     * @returns SessionStorageResponseDto User data stored
     * @throws ApiError
     */
    public saveStore(
        requestBody: SessionStorageRequestDto,
    ): CancelablePromise<SessionStorageResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/session/storage',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Retrieve stored data
     * @param storageId
     * @returns SessionDto Stored data retrieved
     * @throws ApiError
     */
    public getStore(
        storageId: string,
    ): CancelablePromise<SessionDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/session/storage/{storageId}',
            path: {
                'storageId': storageId,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Search storage data
     * @param requestBody
     * @returns SessionStorageEventDto Data retrieved from search
     * @throws ApiError
     */
    public searchStore(
        requestBody: SessionStorageSearchDto,
    ): CancelablePromise<Array<SessionStorageEventDto>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/session/storage/search',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Request support from human
     * @param requestBody
     * @returns SessionSupportResponseDto Human support requested
     * @throws ApiError
     */
    public support(
        requestBody: SessionSupportRequestDto,
    ): CancelablePromise<SessionSupportResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/session/support',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `unauthorized`,
            },
        });
    }
}
