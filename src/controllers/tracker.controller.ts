import { Request, Response } from 'express';

// In-memory / file store fallback for backend daily tracker logs
const dailyLogsStore: Record<string, any> = {};

export const getDailyLogs = (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: dailyLogsStore,
  });
};

export const getDailyLogByDate = (req: Request, res: Response) => {
  const { date } = req.params;
  const log = dailyLogsStore[date] || null;
  res.status(200).json({
    success: true,
    data: log,
  });
};

export const saveDailyLog = (req: Request, res: Response) => {
  const { date, logData } = req.body;
  if (!date || !logData) {
    return res.status(400).json({
      success: false,
      message: 'Date and logData are required',
    });
  }

  dailyLogsStore[date] = {
    ...logData,
    updatedAt: new Date().toISOString(),
  };

  return res.status(200).json({
    success: true,
    message: 'Daily log saved successfully',
    data: dailyLogsStore[date],
  });
};
