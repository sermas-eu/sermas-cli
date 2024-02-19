/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ViewLogsRequestDto = {
    sessionId: string;
    type?: ViewLogsRequestDto.type;
    ts?: string;
};
export namespace ViewLogsRequestDto {
    export enum type {
        SPEECH = 'speech',
        CHARACTERIZATION = 'characterization',
        SPEECH_TO_TEXT = 'speechToText',
    }
}

