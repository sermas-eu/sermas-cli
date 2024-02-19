/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { XRMarkerDto } from '../models/XRMarkerDto';
import type { XRMarkerListRequestDto } from '../models/XRMarkerListRequestDto';
import type { XRMarkerListResponseDto } from '../models/XRMarkerListResponseDto';
import type { XROcclusionResponseDto } from '../models/XROcclusionResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class XrService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List available markers
     * @param requestBody
     * @returns XRMarkerListResponseDto Got available marks
     * @throws ApiError
     */
    public xrMarkerControllerSearchMarker(
        requestBody: XRMarkerListRequestDto,
    ): CancelablePromise<XRMarkerListResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/xr/marker/search',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `unauthorized`,
            },
        });
    }
    /**
     * Create or update a marker
     * @param requestBody
     * @returns XRMarkerDto Marker created or updated
     * @throws ApiError
     */
    public xrMarkerControllerSaveMarker(
        requestBody: XRMarkerDto,
    ): CancelablePromise<XRMarkerDto> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/xr/marker',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Delete a marker
     * @param markerId
     * @returns any Marker deleted
     * @throws ApiError
     */
    public xrMarkerControllerDeleteMarker(
        markerId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/xr/marker/{markerId}',
            path: {
                ':markerId': markerId,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get the marker QR code as image (jpeg)
     * @param markerId
     * @returns binary
     * @throws ApiError
     */
    public xrMarkerControllerGetMarkerQrCode(
        markerId: string,
    ): CancelablePromise<Blob> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/xr/marker/{markerId}',
            path: {
                ':markerId': markerId,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Indicate if a 3D asset model is occluded by a physical obstacle.
     * @returns XROcclusionResponseDto Got information about 3D model
     * @throws ApiError
     */
    public xrOcclusionControllerOcclusion(): CancelablePromise<XROcclusionResponseDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/xr/occlusion',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
}
