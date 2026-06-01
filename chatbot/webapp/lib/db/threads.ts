import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamo } from "../dynamodb";
import { nanoid } from "nanoid";

const db = DynamoDBDocumentClient.from(dynamo);

export async function getThread(threadId: string) {
  const res = await db.send(
    new GetCommand({
      TableName: "Threads",
      Key: { threadId },
    }),
  );

  return res.Item;
}

export async function createThread(userId: string) {
  const threadId = `thread_${nanoid(12)}`;

  await db.send(
    new PutCommand({
      TableName: "Threads",
      Item: {
        threadId,
        userId,
        title: "New chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        agentSessionId: threadId, // 👈 SAME AS THREAD ID
      },
    }),
  );

  return threadId;
}

export async function touchThread(threadId: string) {
  await db.send(
    new UpdateCommand({
      TableName: "Threads",
      Key: { threadId },
      UpdateExpression: "set updatedAt = :u",
      ExpressionAttributeValues: {
        ":u": new Date().toISOString(),
      },
    }),
  );
}
