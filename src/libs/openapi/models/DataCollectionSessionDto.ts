/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataCollectionDataRecordDto } from './DataCollectionDataRecordDto';
export type DataCollectionSessionDto = {
    groupId: string;
    sessionId: string;
    label: string;
    authorId: string;
    created_at: string;
    modified_at: string;
    records: Array<DataCollectionDataRecordDto>;
};

