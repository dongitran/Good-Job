jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

jest.mock('./bootstrap/app-bootstrap', () => ({
  configureApp: jest.fn(),
}));

import { NestFactory } from '@nestjs/core';
import { configureApp } from './bootstrap/app-bootstrap';

describe('main bootstrap', () => {
  it('creates app and starts listening on configured port', async () => {
    const listen = jest.fn().mockResolvedValue(undefined);
    const getOrThrow = jest.fn().mockReturnValue(3000);
    const app = {
      get: jest.fn().mockReturnValue({ getOrThrow }),
      listen,
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(app);

    await import('./main');
    await new Promise((resolve) => setImmediate(resolve));

    expect(NestFactory.create).toHaveBeenCalled();
    expect(configureApp).toHaveBeenCalledWith(app);
    expect(listen).toHaveBeenCalledWith(3000);
  });
});
