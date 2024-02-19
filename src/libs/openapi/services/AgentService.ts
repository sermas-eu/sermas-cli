/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActuationEventDto } from '../models/ActuationEventDto';
import type { MovementEventDto } from '../models/MovementEventDto';
import type { SermasBaseDto } from '../models/SermasBaseDto';
import type { StatusEventDto } from '../models/StatusEventDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AgentService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * move the robot to a specified coordinates. Based on the parameter coordinates, move the robot to that coordinates.
     * @param appId
     * @param room
     * @returns any
     * @throws ApiError
     */
    public roboticsAgentControllerMoveToArea(
        appId: string,
        room: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/robotics/agent/move/{appId}/{room}',
            path: {
                'appId': appId,
                'room': room,
            },
        });
    }
    /**
     * get the status of the robot
     * @param appId
     * @param robotId
     * @returns any
     * @throws ApiError
     */
    public roboticsAgentControllerStatusDescription(
        appId: string,
        robotId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/robotics/agent/status/{appId}/{robotId}',
            path: {
                'appId': appId,
                'robotId': robotId,
            },
        });
    }
    /**
     * relocate the robot
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public roboticsAgentControllerMove(
        requestBody: MovementEventDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/robotics/agent/relocate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * set initial pose of the robot
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public roboticsAgentControllerInitialPose(
        requestBody: SermasBaseDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/robotics/agent/initialpose',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * execute an action on the robot
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public roboticsAgentControllerActuate(
        requestBody: ActuationEventDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/robotics/agent/actuate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * get the status of the robot
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public roboticsAgentControllerStatus(
        requestBody: StatusEventDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/robotics/agent/status',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
