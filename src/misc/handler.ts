import type { Response } from 'express';
import express from 'express';

/**
 * Representation of a misc handler.
 */
const MiscHandler = () => {
  const handler = express();

  /**
   * Checks the health of the service.
   */
  handler.get('/', (_, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'Sucessfully connected to the sample API.',
      data: null,
    });
  });

  return handler;
};

export default MiscHandler;
