import { PlatformAppDto } from "@sermas/api-client";

export class CliTemplateDto<T = any> {
  type: string;
  metadata?: { [key: string]: any };
  content: T;
}

export class PlatformAppCliTemplateDto extends CliTemplateDto<PlatformAppDto> {
  override type = "platform.app";
}

export class PlatformModuleCliTemplateDto extends CliTemplateDto<PlatformAppDto> {
  override type = "platform.module";
}
