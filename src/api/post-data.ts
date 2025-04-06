import { EnvConfig } from "@/utils/constants/env.config";

const { api } = EnvConfig();
export async function sendFormData<T = any>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const controller = new AbortController();

  try {
    const response = await fetch(`${api}${endpoint}`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    return contentType?.includes("application/json")
      ? response.json()
      : (response.text() as T);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to submit form data: ${errorMessage}`);
  }
}

export async function sendFormDataJson(endpoint: string, formData: any) {
  try {
    const response = await fetch(`${api}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    return contentType?.includes("application/json")
      ? response.json()
      : response.text();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to submit form data: ${errorMessage}`);
  }
}
