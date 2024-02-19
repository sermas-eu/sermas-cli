/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttachmentsDto } from './AttachmentsDto';
import type { DataCollectionFeedbackDto } from './DataCollectionFeedbackDto';
import type { DataCollectionSlotSpanDto } from './DataCollectionSlotSpanDto';
export type DataCollectionDataRecordDto = {
    subject: string;
    intent: string;
    text: string;
    slots: Array<DataCollectionSlotSpanDto>;
    feedbacks: Array<DataCollectionFeedbackDto>;
    attachments: Array<AttachmentsDto>;
    timestamp: string;
    emotion: string;
    gesture: string;
    action: string;
};

