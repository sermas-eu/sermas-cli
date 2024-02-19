/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KeycloakTokenDto } from '../models/KeycloakTokenDto';
import type { LoginRequestDto } from '../models/LoginRequestDto';
import type { LoginResponseDto } from '../models/LoginResponseDto';
import type { RefreshTokenRequestDto } from '../models/RefreshTokenRequestDto';
import type { RegistrationRequestDto } from '../models/RegistrationRequestDto';
import type { RegistrationResponseDto } from '../models/RegistrationResponseDto';
import type { UpdateUserRequestDto } from '../models/UpdateUserRequestDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthenticationService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns KeycloakTokenDto
     * @throws ApiError
     */
    public whoami(): CancelablePromise<KeycloakTokenDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/auth/whoami',
            errors: {
                401: `Not authorized`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns LoginResponseDto Login user
     * @throws ApiError
     */
    public login(
        requestBody: LoginRequestDto,
    ): CancelablePromise<LoginResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Not authorized`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns RegistrationResponseDto Register a new user
     * @throws ApiError
     */
    public register(
        requestBody: RegistrationRequestDto,
    ): CancelablePromise<RegistrationResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns LoginResponseDto Refresh token
     * @throws ApiError
     */
    public refreshToken(
        requestBody: RefreshTokenRequestDto,
    ): CancelablePromise<LoginResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Not authorized`,
            },
        });
    }
    /**
     * @param userId
     * @param requestBody
     * @returns any Updates user data
     * @throws ApiError
     */
    public edit(
        userId: string,
        requestBody: UpdateUserRequestDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/auth/{userId}',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Not authorized`,
            },
        });
    }
    /**
     * @param userId
     * @returns any Deletes a user and all of its resources
     * @throws ApiError
     */
    public delete(
        userId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/auth/{userId}',
            path: {
                'userId': userId,
            },
            errors: {
                401: `Not authorized`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public authAdminControllerSaveUser(
        requestBody: RegistrationRequestDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/admin/user',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
