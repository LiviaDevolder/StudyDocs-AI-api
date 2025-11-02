import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { CreateProjectInput } from './dto/create-project.dto';
import { UpdateProjectInput } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(
    createProjectInput: CreateProjectInput,
    user: User,
  ): Promise<Project> {
    const existingProject = await this.projectRepository.findOne({
      where: { name: createProjectInput.name, userId: user.id },
    });

    if (existingProject) {
      throw new ConflictException(
        `Project with name "${createProjectInput.name}" already exists.`,
      );
    }

    const project = this.projectRepository.create({
      ...createProjectInput,
      userId: user.id,
    });

    try {
      return await this.projectRepository.save(project);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException(
          `Project with name "${createProjectInput.name}" already exists.`,
        );
      }

      this.logger.error(
        `Failed to create project for user ${user.id}. Data: ${JSON.stringify(createProjectInput)}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'An error occurred while creating the project.',
      );
    }
  }

  async findAll(): Promise<Project[]> {
    return await this.projectRepository.find();
  }

  async findOne(id: string): Promise<Project | null> {
    return await this.projectRepository.findOneBy({ id });
  }

  async update(
    id: string,
    updateProjectInput: UpdateProjectInput,
  ): Promise<Project | null> {
    await this.projectRepository.update(id, updateProjectInput);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<Project | null> {
    const project = await this.findOne(id);
    if (project) {
      await this.projectRepository.delete(id);
    }
    return project;
  }
}
