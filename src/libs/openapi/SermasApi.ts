/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { AxiosHttpRequest } from './core/AxiosHttpRequest';
import { AgentService } from './services/AgentService';
import { AuthenticationService } from './services/AuthenticationService';
import { DetectionService } from './services/DetectionService';
import { DialogueService } from './services/DialogueService';
import { PlatformService } from './services/PlatformService';
import { RoboticsService } from './services/RoboticsService';
import { SessionService } from './services/SessionService';
import { UiService } from './services/UiService';
import { XrService } from './services/XrService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class SermasApi {
    public readonly agent: AgentService;
    public readonly authentication: AuthenticationService;
    public readonly detection: DetectionService;
    public readonly dialogue: DialogueService;
    public readonly platform: PlatformService;
    public readonly robotics: RoboticsService;
    public readonly session: SessionService;
    public readonly ui: UiService;
    public readonly xr: XrService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = AxiosHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '',
            VERSION: config?.VERSION ?? '1.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.agent = new AgentService(this.request);
        this.authentication = new AuthenticationService(this.request);
        this.detection = new DetectionService(this.request);
        this.dialogue = new DialogueService(this.request);
        this.platform = new PlatformService(this.request);
        this.robotics = new RoboticsService(this.request);
        this.session = new SessionService(this.request);
        this.ui = new UiService(this.request);
        this.xr = new XrService(this.request);
    }
}

