/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DialogueTextToSpeechDto = {
    appId: string;
    /**
     * Reference to the authenticated client the request originated from
     */
    clientId?: string;
    /**
     * Track the interaction session, if available
     */
    sessionId?: string;
    actor: string;
    /**
     * Text to convert to speech. If emotion field is set, it will be converted to SSML. If also `ssml` field is set, this field will be ignored
     */
    text?: string;
    gender: string;
    language: string;
    emotion?: Record<string, any>;
    llm?: string;
    /**
     * Indicate a chunck identifier as timestamp, usually indicating it is part of a stream.
     */
    chunkId?: number;
    /**
     * SSML markup to render as speech.
     */
    ssml?: string;
};

