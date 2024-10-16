/**
 * Logs a message with the current date and time in 'en-GB' format.
 * @param message - The message to be logged.
 *
 * Example usage:
 * ```typescript
 * log("Hello, world!");
 * ```
 *
 * Example output if called at 12:00:00 on 1st January 2000:
 * ```
 * 01/01/2000, 12:00:00: Hello, world!
 * ```
 */
export const log = (message: string) => {
  const datetime = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  console.log(datetime + ": " + message);
};
