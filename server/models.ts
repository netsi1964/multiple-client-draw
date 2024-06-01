interface PathData {
  stroke: string;
  d: string;
  userId: string;
}

interface BaseMessageType {
  type: MessageTypes;
  userId: string;
}

interface MessageTypeUserAdded extends BaseMessageType {
  users: string[];
}

interface MessageTypeWelcome extends BaseMessageType {
  paths: PathData[];
  message: string;
}

interface MessageTypeDraw extends BaseMessageType, PathData {}

interface MessageTypeClearUserStroke extends BaseMessageType {
  paths: PathData[];
}

interface MessageTypeUserLeft extends BaseMessageType {
  users: string[];
}

// make a type which combines MessageTypeUserLeft and MessageTypeDraw
type KnownMessageTypes =
  | MessageTypeUserAdded
  | MessageTypeWelcome
  | MessageTypeDraw
  | MessageTypeClearUserStroke
  | MessageTypeUserLeft;

enum SocketEvents {
  OPEN = "open",
  MESSAGE = "message",
  CLOSE = "close",
  ERROR = "error",
}

enum MessageTypes {
  USER_ADDED = "userAdded",
  WELCOME = "welcome",
  DRAW = "draw  ",
  CLEAR_USER_STROKE = "clearUserStroke",
  USER_LEFT = "userLeft",
}

export type {
  PathData,
  KnownMessageTypes,
  MessageTypeUserAdded,
  MessageTypeWelcome,
  MessageTypeDraw,
  MessageTypeClearUserStroke,
  MessageTypeUserLeft,
};
export { SocketEvents, MessageTypes };
