import type { Message } from "@/types";

export function UserMessage({ message }: { message: Message }) {
  return (
    <div className="message-user animate-in">
      <div className="message-user-bubble">{message.content}</div>
    </div>
  );
}
