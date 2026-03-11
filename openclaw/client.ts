import { MemoryClient as BaseMemoryClient } from "mem0ai";

class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "APIError";
  }
}

export default class MemoryClient extends BaseMemoryClient {
  async ping(): Promise<void> {
    try {
      const response = await this._fetchWithErrorHandling(
        `${this.host}/v1/ping/`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${this.apiKey}`,
          },
        },
      );

      if (!response || typeof response !== "object") {
        throw new APIError("Invalid response format from ping endpoint");
      }

      if (response.status && response.status !== "ok") {
        throw new APIError(response.message || "API Key is invalid");
      }

      const { org_id, project_id, user_email } = response;

      // Only update if values are actually present
      if (org_id && !this.organizationId) this.organizationId = org_id;
      if (project_id && !this.projectId) this.projectId = project_id;
      const telemetryId = user_email || project_id;
      if (telemetryId) this.telemetryId = telemetryId;
    } catch (error: any) {
      // Convert generic errors to APIError with meaningful messages
      if (error instanceof APIError) {
        throw error;
      } else {
        throw new APIError(
          `Failed to ping server: ${error.message || "Unknown error"}`,
        );
      }
    }
  }
}
