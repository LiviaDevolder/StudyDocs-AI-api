import { InputType, PartialType } from '@nestjs/graphql';
import { CreateProjectInput } from './create-project.dto';

@InputType()
export class UpdateProjectInput extends PartialType(CreateProjectInput) {}
