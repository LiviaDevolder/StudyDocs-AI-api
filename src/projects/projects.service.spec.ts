/* eslint-disable @typescript-eslint/unbound-method */
import { ProjectsService } from './projects.service';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectInput } from './dto/create-project.dto';
import { UpdateProjectInput } from './dto/update-project.dto';
import { createMockRepository } from '../../test';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: jest.Mocked<Repository<Project>>;

  beforeEach(() => {
    projectRepository = createMockRepository<Project>();
    service = new ProjectsService(projectRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      // Arrange
      const createInput: CreateProjectInput = {
        name: 'My Study Project',
        userId: 'user-123',
      };
      const savedProject = {
        id: 'proj-1',
        name: 'My Study Project',
        userId: 'user-123',
      } as Project;
      projectRepository.create.mockReturnValue(savedProject);
      projectRepository.save.mockResolvedValue(savedProject);

      // Act
      const result = await service.create(createInput);

      // Assert
      expect(result).toEqual(savedProject);
      expect(result.name).toBe('My Study Project');
      expect(projectRepository.create).toHaveBeenCalledWith(createInput);
      expect(projectRepository.save).toHaveBeenCalledWith(savedProject);
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      // Arrange
      const projects = [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ] as Project[];
      projectRepository.find.mockResolvedValue(projects);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(projects);
      expect(result).toHaveLength(2);
      expect(projectRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no projects exist', async () => {
      // Arrange
      projectRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      // Arrange
      const project = {
        id: 'proj-1',
        name: 'Test Project',
        userId: 'user-1',
      } as Project;
      projectRepository.findOneBy.mockResolvedValue(project);

      // Act
      const result = await service.findOne('proj-1');

      // Assert
      expect(result).toEqual(project);
      expect(projectRepository.findOneBy).toHaveBeenCalledWith({
        id: 'proj-1',
      });
    });

    it('should return null when project not found', async () => {
      // Arrange
      projectRepository.findOneBy.mockResolvedValue(null);

      // Act
      const result = await service.findOne('nonexistent');

      // Assert
      expect(result).toBeNull();
      expect(projectRepository.findOneBy).toHaveBeenCalledWith({
        id: 'nonexistent',
      });
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      // Arrange
      const updateInput: UpdateProjectInput = { name: 'Updated Project' };
      const updatedProject = {
        id: 'proj-1',
        name: 'Updated Project',
        userId: 'user-1',
      } as Project;
      projectRepository.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);
      projectRepository.findOneBy.mockResolvedValue(updatedProject);

      // Act
      const result = await service.update('proj-1', updateInput);

      // Assert
      expect(result).toEqual(updatedProject);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Project');
      expect(projectRepository.update).toHaveBeenCalledWith(
        'proj-1',
        updateInput,
      );
      expect(projectRepository.findOneBy).toHaveBeenCalledWith({
        id: 'proj-1',
      });
    });

    it('should return updated project even when no changes were made', async () => {
      // Arrange
      const updateInput: UpdateProjectInput = { name: 'Same Name' };
      const project = {
        id: 'proj-1',
        name: 'Same Name',
      } as Project;
      projectRepository.update.mockResolvedValue({
        affected: 0,
      } as UpdateResult);
      projectRepository.findOneBy.mockResolvedValue(project);

      // Act
      const result = await service.update('proj-1', updateInput);

      // Assert
      expect(result).toEqual(project);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      // Arrange
      const project = {
        id: 'proj-1',
        name: 'To Delete',
      } as Project;
      projectRepository.findOneBy.mockResolvedValue(project);
      projectRepository.delete.mockResolvedValue({
        affected: 1,
      } as DeleteResult);

      // Act
      const result = await service.remove('proj-1');

      // Assert
      expect(result).toEqual(project);
      expect(projectRepository.findOneBy).toHaveBeenCalledWith({
        id: 'proj-1',
      });
      expect(projectRepository.delete).toHaveBeenCalledWith('proj-1');
    });

    it('should return null when trying to delete non-existent project', async () => {
      // Arrange
      projectRepository.findOneBy.mockResolvedValue(null);

      // Act
      const result = await service.remove('nonexistent');

      // Assert
      expect(result).toBeNull();
      expect(projectRepository.findOneBy).toHaveBeenCalledWith({
        id: 'nonexistent',
      });
      expect(projectRepository.delete).not.toHaveBeenCalled();
    });
  });
});
