import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { CreateProjectInput } from './dto/create-project.dto';
import { UpdateProjectInput } from './dto/update-project.dto';

@Resolver(() => Project)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @Mutation(() => Project)
  createProject(
    @Args('createProjectInput') createProjectInput: CreateProjectInput,
  ) {
    return this.projectsService.create(createProjectInput);
  }

  @Query(() => [Project], { name: 'projects' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Query(() => Project, { name: 'project' })
  findOne(@Args('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Mutation(() => Project)
  updateProject(
    @Args('id') id: string,
    @Args('updateProjectInput') updateProjectInput: UpdateProjectInput,
  ) {
    return this.projectsService.update(id, updateProjectInput);
  }

  @Mutation(() => Project)
  removeProject(@Args('id') id: string) {
    return this.projectsService.remove(id);
  }
}
