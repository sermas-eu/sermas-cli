/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SentimentAnalysisRequest } from '../models/SentimentAnalysisRequest';
import type { UserInteractionIntentionDto } from '../models/UserInteractionIntentionDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DetectionService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public detectionControllerSentimentAnalysis(
        requestBody: SentimentAnalysisRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/detection/sentiment-analysis',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public detectionControllerInteractionIntention(
        requestBody: UserInteractionIntentionDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/detection/interaction',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param appId
     * @param cameraId
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public detectionControllerSendFrame(
        appId: string,
        cameraId: string,
        formData: {
            file?: Blob;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/detection/{appId}/{cameraId}/frame',
            path: {
                'appId': appId,
                'cameraId': cameraId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param appId
     * @param cameraId
     * @param overlay
     * @returns any
     * @throws ApiError
     */
    public detectionControllerServe(
        appId: string,
        cameraId: string,
        overlay: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/detection/{appId}/{cameraId}/camera',
            path: {
                'appId': appId,
                'cameraId': cameraId,
            },
            query: {
                'overlay': overlay,
            },
        });
    }
}
