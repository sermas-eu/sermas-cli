import { PlatformAppDto } from '../openapi';

export class CliTemplateDto<T = any> {
  type: string;
  metadata?: { [key: string]: any };
  content: T;
}

export class PlatformAppCliTemplateDto extends CliTemplateDto<PlatformAppDto> {
  override type = 'platform.app';
}

export class PlatformModuleCliTemplateDto extends CliTemplateDto<PlatformAppDto> {
  override type = 'platform.module';
}
