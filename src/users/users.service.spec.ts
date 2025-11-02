/* eslint-disable @typescript-eslint/unbound-method */
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.dto';
import { UpdateUserInput } from './dto/update-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createMockRepository } from '../../test';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    userRepository = createMockRepository<User>();
    service = new UsersService(userRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      // Arrange
      const createUserInput: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const hashedPassword = 'hashed_password';
      const savedUser = {
        id: 'user-1',
        ...createUserInput,
        password: hashedPassword,
      } as User;

      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);

      // Act
      const result = await service.create(createUserInput);

      // Assert
      expect(result).toEqual(savedUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserInput.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserInput.password, 10);
      expect(userRepository.save).toHaveBeenCalledWith(savedUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const createUserInput: CreateUserInput = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const existingUser = {
        id: 'user-1',
        email: 'existing@example.com',
      } as User;
      userRepository.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.create(createUserInput)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserInput)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return all users with projects relation', async () => {
      // Arrange
      const users = [
        { id: '1', email: 'user1@example.com', name: 'User 1' },
        { id: '2', email: 'user2@example.com', name: 'User 2' },
      ] as User[];
      userRepository.find.mockResolvedValue(users);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(users);
      expect(result).toHaveLength(2);
      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['projects'],
      });
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      userRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      } as User;
      userRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.findOne('user-1');

      // Assert
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['projects'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'User with ID nonexistent not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: 'test@example.com',
      } as User;
      userRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      // Arrange
      const updateInput: UpdateUserInput = { name: 'Updated Name' };
      const existingUser = {
        id: '1',
        name: 'Old Name',
        email: 'test@example.com',
      } as User;
      const updatedUser = {
        ...existingUser,
        ...updateInput,
      } as User;

      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update('1', updateInput);

      // Assert
      expect(result.name).toBe('Updated Name');
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should hash password when updating password', async () => {
      // Arrange
      const updateInput: UpdateUserInput = { password: 'newpassword123' };
      const existingUser = { id: '1', password: 'oldpassword' } as User;
      const hashedPassword = 'hashed_new_password';

      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepository.save.mockResolvedValue({
        ...existingUser,
        password: hashedPassword,
      });

      // Act
      await service.update('1', updateInput);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(
        service.update('nonexistent', { name: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      // Arrange
      const user = { id: '1', email: 'test@example.com' } as User;
      jest.spyOn(service, 'findOne').mockResolvedValue(user);
      userRepository.remove.mockResolvedValue(user);

      // Act
      const result = await service.remove('1');

      // Assert
      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      // Arrange
      const plainPassword = 'password123';
      const hashedPassword = 'hashed_password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validatePassword(
        plainPassword,
        hashedPassword,
      );

      // Assert
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
    });

    it('should return false for invalid password', async () => {
      // Arrange
      const plainPassword = 'wrongpassword';
      const hashedPassword = 'hashed_password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.validatePassword(
        plainPassword,
        hashedPassword,
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
