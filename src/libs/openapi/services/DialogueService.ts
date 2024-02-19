/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageDto } from '../models/ChatMessageDto';
import type { DataCollectionGroupDto } from '../models/DataCollectionGroupDto';
import type { DataCollectionSessionDto } from '../models/DataCollectionSessionDto';
import type { DialogueDocumentDto } from '../models/DialogueDocumentDto';
import type { DialogueTextToSpeechDto } from '../models/DialogueTextToSpeechDto';
import type { DialogueUserMessageDto } from '../models/DialogueUserMessageDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DialogueService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerIntents(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/intents',
            path: {
                'appId': appId,
            },
        });
    }
    /**
     * Get slots based on intent and subject
     * @param appId
     * @param intent
     * @param subject
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerSlots(
        appId: string,
        intent: string,
        subject: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/slots',
            path: {
                'appId': appId,
            },
            query: {
                'intent': intent,
                'subject': subject,
            },
        });
    }
    /**
     * Get all slots
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerAllSlots(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/allslots',
            path: {
                'appId': appId,
            },
        });
    }
    /**
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerEmotions(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/emotions',
            path: {
                'appId': appId,
            },
        });
    }
    /**
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerGestures(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/gestures',
            path: {
                'appId': appId,
            },
        });
    }
    /**
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerActions(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/actions',
            path: {
                'appId': appId,
            },
        });
    }
    /**
     * @param appId
     * @param groupid
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerList(
        appId: string,
        groupid: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/session/{groupid}',
            path: {
                'appId': appId,
                'groupid': groupid,
            },
        });
    }
    /**
     * @param appId
     * @param id
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerDeleteSession(
        appId: string,
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/data-collection/{appId}/session/{id}',
            path: {
                'appId': appId,
                'id': id,
            },
        });
    }
    /**
     * @param appId
     * @param groupid
     * @param id
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerFetch(
        appId: string,
        groupid: string,
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/session/{groupid}/{id}',
            path: {
                'appId': appId,
                'groupid': groupid,
                'id': id,
            },
        });
    }
    /**
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerImport(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/data-collection/{appId}/import',
            path: {
                'appId': appId,
            },
        });
    }
    /**
     * @param appId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerImportFromJson(
        appId: string,
        requestBody: DataCollectionSessionDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/data-collection/{appId}/import/json',
            path: {
                'appId': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param appId
     * @param formData Import from JSON file
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerImportFromFile(
        appId: string,
        formData: {
            file: Blob;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/data-collection/{appId}/import/file',
            path: {
                'appId': appId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param appId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerSave(
        appId: string,
        requestBody: DataCollectionSessionDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/data-collection/{appId}/session',
            path: {
                'appId': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerListGroups(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/group',
            path: {
                'appId': appId,
            },
        });
    }
    /**
     * @param appId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerSaveGroup(
        appId: string,
        requestBody: DataCollectionGroupDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/data-collection/{appId}/group',
            path: {
                'appId': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerStatsGroups(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/groups/stats',
            path: {
                'appId': appId,
            },
        });
    }
    /**
     * @param appId
     * @param groupid
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerDownloadGroupData(
        appId: string,
        groupid: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/download/{groupid}',
            path: {
                'appId': appId,
                'groupid': groupid,
            },
        });
    }
    /**
     * @param appId
     * @param groupId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerDeleteGroup(
        appId: string,
        groupId: any,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/data-collection/{appId}/group/{groupId}',
            path: {
                'appId': appId,
                'groupId': groupId,
            },
        });
    }
    /**
     * @param appId
     * @param formData Import attachment
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerUploadFile(
        appId: string,
        formData: {
            file: Blob;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/data-collection/{appId}/attachment/{groupId}',
            path: {
                'appId': appId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param appId
     * @param attachmentId
     * @param groupId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerGetFile(
        appId: string,
        attachmentId: any,
        groupId: any,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/data-collection/{appId}/group/{groupId}/attachment/{attachmentId}',
            path: {
                'appId': appId,
                'attachmentId': attachmentId,
                'groupId': groupId,
            },
        });
    }
    /**
     * @param appId
     * @param attachmentId
     * @param groupId
     * @returns any
     * @throws ApiError
     */
    public dataCollectionControllerDeleteFile(
        appId: string,
        attachmentId: any,
        groupId: any,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/data-collection/{appId}/group/{groupId}/attachment/{attachmentId}',
            path: {
                'appId': appId,
                'attachmentId': attachmentId,
                'groupId': groupId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns DialogueDocumentDto Saved document
     * @throws ApiError
     */
    public save(
        requestBody: DialogueDocumentDto,
    ): CancelablePromise<DialogueDocumentDto> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/dialogue/document',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Import RAG documents
     * @param requestBody Documents list
     * @returns DialogueDocumentDto
     * @throws ApiError
     */
    public import(
        requestBody: Array<DialogueDocumentDto>,
    ): CancelablePromise<Array<DialogueDocumentDto>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/dialogue/document',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remove RAG documents
     * @param appId
     * @param documentId
     * @returns any
     * @throws ApiError
     */
    public remove(
        appId: string,
        documentId: Array<string>,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/dialogue/document/{appId}',
            path: {
                'appId': appId,
            },
            query: {
                'documentId': documentId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public speak(
        requestBody: DialogueTextToSpeechDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/dialogue/speech/tts',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param appId
     * @param sessionId
     * @param language
     * @param gender
     * @param llm
     * @param sampleRate
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public text(
        appId: string,
        sessionId: string,
        language: string,
        gender: string,
        llm: string,
        sampleRate: number,
        formData: {
            file?: Blob;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/dialogue/speech/stt/{appId}/{sessionId}',
            path: {
                'appId': appId,
                'sessionId': sessionId,
            },
            query: {
                'language': language,
                'gender': gender,
                'llm': llm,
                'sampleRate': sampleRate,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param appId
     * @param sessionId
     * @param language
     * @param gender
     * @param llm
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public chatMessage(
        appId: string,
        sessionId: string,
        language: string,
        gender: string,
        llm: string,
        requestBody: DialogueUserMessageDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/dialogue/speech/chat/{appId}/{sessionId}',
            path: {
                'appId': appId,
                'sessionId': sessionId,
            },
            query: {
                'language': language,
                'gender': gender,
                'llm': llm,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param appId
     * @param sessionId
     * @returns any
     * @throws ApiError
     */
    public stopAgentSpeech(
        appId: string,
        sessionId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/dialogue/speech/stop/{appId}/{sessionId}',
            path: {
                'appId': appId,
                'sessionId': sessionId,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public import1(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/dialogue/admin/document',
        });
    }
    /**
     * @param appId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public chatControllerChat(
        appId: string,
        requestBody: ChatMessageDto,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/chatbot/{appId}/chat',
            path: {
                'appId': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param appId
     * @returns any
     * @throws ApiError
     */
    public chatControllerChatbots(
        appId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/chatbot/{appId}/chatbots',
            path: {
                'appId': appId,
            },
        });
    }
}
