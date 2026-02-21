import { ValidationPipe } from '@nestjs/common';
import { configureApp } from './app-bootstrap';

describe('configureApp', () => {
  it('applies global app configuration', () => {
    const app = {
      get: jest.fn().mockReturnValue({
        getOrThrow: jest.fn().mockReturnValue('http://localhost:5173'),
      }),
      setGlobalPrefix: jest.fn(),
      useGlobalFilters: jest.fn(),
      use: jest.fn(),
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
    };

    configureApp(app as never);

    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(app.useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(app.enableCors).toHaveBeenCalledWith({
      origin: 'http://localhost:5173',
      credentials: true,
    });
    expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
  });
});
