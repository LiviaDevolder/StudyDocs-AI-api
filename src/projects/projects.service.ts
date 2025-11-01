import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectInput } from './dto/create-project.dto';
import { UpdateProjectInput } from './dto/update-project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectInput: CreateProjectInput): Promise<Project> {
    const project = this.projectRepository.create(createProjectInput);
    return await this.projectRepository.save(project);
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
