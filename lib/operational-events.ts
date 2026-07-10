export type CriticalAction = "ask_tutors" | "auth_request" | "onboarding" | "private_memory";

type OperationalContext = {
  action: CriticalAction;
};

export type OperationalErrorEvent = {
  level: "error";
  event: "critical_action_failed";
  action: CriticalAction;
  errorCode: "ACTION_FAILED";
  occurredAt: string;
};

export function createOperationalErrorEvent(context: OperationalContext, _error: unknown, occurredAt = new Date().toISOString()): OperationalErrorEvent {
  return {
    level: "error",
    event: "critical_action_failed",
    action: context.action,
    errorCode: "ACTION_FAILED",
    occurredAt
  };
}

function writeOperationalError(event: OperationalErrorEvent) {
  console.error(JSON.stringify(event));
}

export async function runObservedAction<T>(context: OperationalContext, action: () => Promise<T>, writeEvent: (event: OperationalErrorEvent) => void = writeOperationalError) {
  try {
    return await action();
  } catch (error) {
    writeEvent(createOperationalErrorEvent(context, error));
    throw error;
  }
}
