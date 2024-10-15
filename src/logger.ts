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

export const getResponseLog = (response: Response) => {
  return response.ok ? response.status.toString() : response.status.toString();
};
