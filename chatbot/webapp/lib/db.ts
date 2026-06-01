import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamo } from "./dynamodb";
import { nanoid } from "nanoid";

const db = DynamoDBDocumentClient.from(dynamo);

// IDENTITIES TABLE

export async function getIdentity(providerId: string) {
  const res = await db.send(
    new GetCommand({
      TableName: "Identities",
      Key: { providerId },
    }),
  );

  return res.Item;
}

export async function createIdentity(data: {
  providerId: string;
  provider: string;
  userId: string;
}) {
  await db.send(
    new PutCommand({
      TableName: "Identities",
      Item: {
        ...data,
        createdAt: new Date().toISOString(),
      },
    }),
  );
}

// USERS TABLE

export async function createUser(data: {
  email?: string;
  name?: string;
  image?: string;
}) {
  const userId = `usr_${nanoid(12)}`;

  await db.send(
    new PutCommand({
      TableName: "Users",
      Item: {
        userId,
        ...data,
        createdAt: new Date().toISOString(),
      },
    }),
  );

  return userId;
}
