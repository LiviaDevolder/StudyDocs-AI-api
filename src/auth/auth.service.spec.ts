/* eslint-disable @typescript-eslint/unbound-method */
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserInput } from '../users/dto/create-user.dto';
import { LoginInput } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { createMockService } from '../../test';
import { MockProxy } from 'jest-mock-extended';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: MockProxy<UsersService>;
  let jwtService: MockProxy<JwtService>;

  beforeEach(() => {
    usersService = createMockService<UsersService>();
    jwtService = createMockService<JwtService>();

    service = new AuthService(usersService, jwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return auth response', async () => {
      // Arrange
      const createUserInput: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      } as User;
      const token = 'jwt-token';

      usersService.create.mockResolvedValue(user);
      jwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.register(createUserInput);

      // Assert
      expect(result).toEqual({
        accessToken: token,
        user,
      });
      expect(usersService.create).toHaveBeenCalledWith(createUserInput);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
    });
  });

  describe('login', () => {
    it('should login user and return auth response', async () => {
      // Arrange
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      } as User;
      const token = 'jwt-token';

      usersService.findByEmail.mockResolvedValue(user);
      usersService.validatePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.login(loginInput);

      // Assert
      expect(result).toEqual({
        accessToken: token,
        user,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(usersService.validatePassword).toHaveBeenCalledWith(
        loginInput.password,
        user.password,
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedpassword',
      } as User;

      usersService.findByEmail.mockResolvedValue(user);
      usersService.validatePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginInput)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const loginInput: LoginInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const user = {
        id: 'user-1',
        email,
        password: 'hashedpassword',
      } as User;

      usersService.findByEmail.mockResolvedValue(user);
      usersService.validatePassword.mockResolvedValue(true);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toEqual(user);
    });

    it('should return null for invalid password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const user = {
        id: 'user-1',
        email,
        password: 'hashedpassword',
      } as User;

      usersService.findByEmail.mockResolvedValue(user);
      usersService.validatePassword.mockResolvedValue(false);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      usersService.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });
  });
});
