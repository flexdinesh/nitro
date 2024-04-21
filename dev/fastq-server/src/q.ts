import fastq from "fastq";
import type { queue, done, queueAsPromised } from "fastq";

export type Payload = {
  request: {
    url: string;
    host: string;
    path: string;
    method: string;
    headers: object;
    queryString?: string;
    body?: unknown;
    [key: string]: unknown;
  };
};

export const q: queueAsPromised<Payload> = fastq.promise(consumer, 1);

async function consumer(arg: Payload): Promise<void> {
  // No need for a try-catch block, fastq handles errors automatically
  console.log("Processing queue item: ", { url: arg.request.url });
  const { request } = arg;
  try {
    const res = await fetch(request.url, {
      method: request.method ?? "GET",
      headers: {
        "X-Cache-Hint": "REVALIDATE",
        ...(request.headers ?? {}),
      },
      body: request.body ? JSON.stringify(request.body) : undefined,
    });
    console.log(
      `Processing completed. Status: ${res.status}. StatusText: ${res.statusText}`
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(`Processing failed. Error: ${e.name}. Message: ${e.message}`);
    } else {
      console.log(`Processing failed.`);
    }
  }
}
