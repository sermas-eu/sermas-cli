import { LoginResponseDto } from "@sermas/api-client";
import { CliInstanceCredentialsCollection } from "../dto/cli.dto";
import { CliConfigHandler } from "./config";

export class CliCredentialsHandler {
  private credentials: CliInstanceCredentialsCollection = {};

  constructor(
    private readonly config: CliConfigHandler,
    private readonly credentialsFile,
  ) {}

  async getAll(domain: string) {
    return this.credentials[domain] || null;
  }

  async get(domain: string, clientId: string) {
    if (!this.credentials[domain]) return null;
    return this.credentials[domain][clientId] || null;
  }

  async save(domain: string, clientId: string, data: LoginResponseDto) {
    this.credentials[domain] = this.credentials[domain] || {};
    this.credentials[domain][clientId] = data;
    return data;
  }

  async clear(domain: string) {
    this.credentials[domain] = {};
  }

  async remove(domain: string, clientId: string) {
    if (!this.credentials[domain]) return;
    if (!this.credentials[domain][clientId]) return;
    delete this.credentials[domain][clientId];
  }
}
