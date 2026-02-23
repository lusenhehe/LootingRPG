export type EventHandlerMap<
  EventMap extends object,
  Context,
> = {
  [K in keyof EventMap]?: (ctx: Context, payload: EventMap[K]) => void;
};

export const createEventDispatcher = <
  EventMap extends object,
  Context,
  HandlerKey extends string,
>(
  keys: HandlerKey[],
  handlers: Record<HandlerKey, EventHandlerMap<EventMap, Context>>,
  context: Context,
) => {
  return <T extends keyof EventMap>(eventName: T, payload: EventMap[T]) => {
    keys.forEach((key) => {
      const handler = handlers[key][eventName] as ((ctx: Context, payload: EventMap[T]) => void) | undefined;
      handler?.(context, payload);
    });
  };
};
