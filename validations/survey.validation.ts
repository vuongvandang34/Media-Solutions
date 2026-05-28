import { z } from 'zod';
import { SurveyStatus, SurveyModelType, SurveyBlockGroup, SurveyBlockType, SurveyQuestionType } from '@prisma/client';

export const surveyOptionSchema = z.object({
  optionText: z.string().min(1, 'Option text is required'),
  orderIndex: z.number().int().default(0),
});

export const surveyQuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionType: z.nativeEnum(SurveyQuestionType),
  isRequired: z.boolean().default(true),
  orderIndex: z.number().int().default(0),
  metadataJson: z.any().optional(),
  options: z.array(surveyOptionSchema).default([]),
});

export const surveyBlockSchema = z.object({
  blockOrder: z.number().int().positive(),
  blockGroup: z.nativeEnum(SurveyBlockGroup),
  blockType: z.nativeEnum(SurveyBlockType),
  title: z.string().optional().nullable().or(z.literal('')),
  questions: z.array(surveyQuestionSchema).min(1, 'Each block must contain at least 1 question'),
});

export const surveySchema = z.object({
  name: z.string().min(2, 'Survey name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable().or(z.literal('')),
  greetingText: z.string().max(500).optional().nullable().or(z.literal('')),
  modelType: z.nativeEnum(SurveyModelType).default(SurveyModelType.ONE_PART),
  defaultLanguage: z.string().default('en'),
  goodThreshold: z.number().int().positive().default(4),
  badThreshold: z.number().int().positive().default(2),
  status: z.nativeEnum(SurveyStatus).default(SurveyStatus.DRAFT),
  blocks: z.array(surveyBlockSchema),
}).refine(data => data.badThreshold < data.goodThreshold, {
  message: 'Bad threshold must be lower than good threshold',
  path: ['badThreshold'],
}).refine(data => {
  const blockCount = data.blocks.length;
  if (data.modelType === SurveyModelType.ONE_PART) return blockCount === 1;
  if (data.modelType === SurveyModelType.TWO_PARTS) return blockCount === 2;
  if (data.modelType === SurveyModelType.THREE_PARTS) return blockCount === 3;
  return false;
}, {
  message: 'Number of blocks must exactly match the selected survey model type',
  path: ['blocks'],
});

export type SurveyInput = z.infer<typeof surveySchema>;
