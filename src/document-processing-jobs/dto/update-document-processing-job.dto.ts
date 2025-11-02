import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { JobStatus } from '../entities/document-processing-job.entity';

@InputType()
export class UpdateDocumentProcessingJobDto {
  @Field(() => JobStatus, { nullable: true })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @Field(() => Int, {
    nullable: true,
    description: 'Progress percentage (0-100)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @Field({ nullable: true, description: 'Current step description' })
  @IsOptional()
  @IsString()
  currentStep?: string;

  @Field({ nullable: true, description: 'Error message if job failed' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @Field({ nullable: true, description: 'Error stack trace' })
  @IsOptional()
  @IsString()
  errorStack?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalChunks?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  processedChunks?: number;
}
