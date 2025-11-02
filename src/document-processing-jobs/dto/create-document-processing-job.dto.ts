import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { JobType } from '../entities/document-processing-job.entity';

@InputType()
export class CreateDocumentProcessingJobDto {
  @Field()
  @IsUUID()
  documentId: string;

  @Field(() => JobType, { nullable: true, defaultValue: JobType.FULL_PROCESS })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;
}
