/**
 * Global error handler for unhandled promise rejections and uncaught exceptions.
 */
export default () => {
  const errorHandler = (error: Error) => {
    console.error(error);
  };

  process.on('unhandledRejection', errorHandler);
  process.on('uncaughtException', errorHandler);
  process.on('uncaughtExceptionMonitor', errorHandler);
};
