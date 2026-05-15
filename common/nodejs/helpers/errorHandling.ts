const getErrorMessage = (error: unknown, customErrorStr = ''): string => {
  if (error instanceof Error) {
    return customErrorStr ? `${customErrorStr}: ${error.message}` : error.message;
  }

  return 'Unknown error';
};

export { getErrorMessage };
