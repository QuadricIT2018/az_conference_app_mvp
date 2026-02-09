import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
) => {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
};

export const sendCreated = <T>(res: Response, data: T, message?: string) => {
  sendSuccess(res, data, 201, message);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const sendNoContent = (res: Response) => {
  res.status(204).send();
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500
) => {
  res.status(statusCode).json({
    success: false,
    error,
  });
};
