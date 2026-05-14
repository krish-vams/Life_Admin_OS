function writeLog(level, message, details = {}) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...details
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.log(output);
}

export function logInfo(message, details) {
  writeLog("info", message, details);
}

export function logWarn(message, details) {
  writeLog("warn", message, details);
}

export function logError(message, error, details = {}) {
  writeLog("error", message, {
    ...details,
    error: {
      name: error?.name,
      message: error?.message,
      code: error?.code
    }
  });
}
