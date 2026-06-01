import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamo } from "../dynamodb";
import { nanoid } from "nanoid";

const db = DynamoDBDocumentClient.from(dynamo);

export async function saveMessage(data: {
  threadId: string;
  role: "user" | "assistant";
  content: string;
}) {
  const createdAt = new Date().toISOString();

  await db.send(
    new PutCommand({
      TableName: "Messages",
      Item: {
        threadId: data.threadId,
        createdAt,
        messageId: nanoid(),

        role: data.role,
        content: data.content,
      },
    }),
  );

  return createdAt;
}

export async function getMessages(threadId: string) {
  const res = await db.send(
    new QueryCommand({
      TableName: "Messages",
      KeyConditionExpression: "threadId = :t",
      ExpressionAttributeValues: {
        ":t": threadId,
      },
      ScanIndexForward: true, // oldest -> newest
    }),
  );

  return res.Items ?? [];
}
