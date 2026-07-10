import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Category } from '@/category/entities/category.entity';
import { CategoryService } from '@/category/services/category.service';
import type { CursorPaginationOptions } from '@/common/decorators/cursor-pagination.decorator';
import { CursorPagination } from '@/common/decorators/cursor-pagination.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User, UserRoles } from '@/user/entities/user.entity';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { Entry } from '../entities/entry.entity';
import { EntryService } from '../services/entry.service';
import { SmartEntryService } from '../services/smart-entry.service';

const OptionalCategorySchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z
      .string()
      .max(40, 'O nome da categoria deve ter no máximo 40 caracteres')
      .transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase()))
      .optional(),
  })
  .optional()
  .nullable();

const CreateEntrySchema = z.object({
  type: z.enum([EntryTypes.Income, EntryTypes.Expense]),
  amount: z.number().min(0.01, 'Valor mínimo: R$ 0,01'),
  description: z
    .string()
    .max(60, 'A descrição deve ter no máximo 60 caracteres')
    .optional(),
  when: z.string().datetime({ message: 'Informe uma data' }),
  category: OptionalCategorySchema,
});

const CreateBulkEntrySchema = z.object({
  entries: z.array(CreateEntrySchema),
});

const UpdateEntrySchema = z.object({
  type: z.enum([EntryTypes.Income, EntryTypes.Expense]).optional(),
  amount: z.number().min(0.01, 'Valor mínimo: R$ 0,01').optional(),
  description: z
    .string()
    .max(60, 'A descrição deve ter no máximo 60 caracteres')
    .optional(),
  when: z.string().datetime().optional(),
  category: OptionalCategorySchema,
});

const SmartExtractSchema = z.object({
  text: z.string().trim().min(1).optional(),
  now: z.iso.datetime(),
});

@Controller('entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.User)
export class EntryController {
  constructor(
    private readonly entryService: EntryService,
    private readonly categoryService: CategoryService,
    private readonly smartEntryService: SmartEntryService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async index(
    @AuthUser() user: User,
    @Query('filter') queryFilter: any,
    @Query('order') queryOrder: any,
    @CursorPagination() pagination: CursorPaginationOptions,
  ) {
		if (!pagination.take)
      throw new BadRequestException('No "take" query param provided');

    const requestFilter =
      typeof queryFilter === 'string'
        ? JSON.parse(queryFilter)
        : queryFilter || { when: {} };
    const order =
      typeof queryOrder === 'string'
        ? JSON.parse(queryOrder)
        : queryOrder || { column: 'when', mode: 'DESC' };

    const entries = await this.entryService.list({
      pagination: pagination.paginated ? { cursor: pagination.cursor as any, take: pagination.take } : undefined,
      order,
      filter: {
        ...requestFilter,
        userId: user.id,
        when: {
          ge: requestFilter.when?.ge,
          le: requestFilter.when?.le,
        },
      },
    });

    let nextCursor: string | null = null;

    if (entries.length === pagination.take) {
      const lastEntry = entries[entries.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ when: lastEntry.when, id: lastEntry.id }),
      ).toString('base64');
    }

    return {
      data: entries,
      meta: { nextCursor, take: pagination.take },
    };
  }

  @Get(':id')
  async show(@AuthUser() user: User, @Param('id') id: string) {
    const entry = await this.entryService.findOneBy({
      id,
      userId: user.id,
    });

    if (!entry) throw new NotFoundException('Lançamento não encontrado');

    return { entry };
  }

  @Post()
  async store(
    @AuthUser() user: User,
    @Body(new ZodValidationPipe(CreateEntrySchema))
    body: z.infer<typeof CreateEntrySchema>,
  ) {
    let category: Category | null = null;

    if (body.category?.id) {
      category = await this.categoryService.findOneBy({
        id: body.category.id,
        userId: user.id,
        type: body.type,
      });

      if (!category) throw new NotFoundException('Categoria não encontrada');
    }

    const entry = await this.entryService.create({
      ...body,
      category,
      userId: user.id,
    });

    return { entry };
  }

  @Post('bulk')
  async storeBulk(
    @AuthUser() user: User,
    @Body(new ZodValidationPipe(CreateBulkEntrySchema))
    body: z.infer<typeof CreateBulkEntrySchema>,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const createdEntries: Entry[] = [];

      for (const item of body.entries) {
        let categoryToUse: Category | null = null;

        if (item.category?.id) {
          categoryToUse = await this.categoryService.findOneBy({
            id: item.category.id,
            userId: user.id,
            type: item.type,
          });

          if (!categoryToUse)
            throw new NotFoundException(
              `Categoria não encontrada para o lançamento: ${item.description || 'Sem descrição'}`,
            );
        }

        const entry = await this.entryService.create(
          {
            ...item,
            category: categoryToUse,
            userId: user.id,
          },
          queryRunner,
        );

        createdEntries.push(entry);
      }

      await queryRunner.commitTransaction();
      return { entries: createdEntries };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  @Post('smart-extract')
  @UseInterceptors(FileInterceptor('file'))
  async smartExtract(
    @AuthUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(SmartExtractSchema))
    reqBody: z.infer<typeof SmartExtractSchema>,
  ) {
    if (!file && reqBody.text && reqBody.text.trim().length > 500) {
      throw new BadRequestException(
        'Que história longa! Consegue resumir e enviar de novo?',
      );
    }

    if (!file && !reqBody.text) {
      throw new BadRequestException(
        'Me diga o que aconteceu ou envie um áudio!',
      );
    }

    if (file) {
      try {
        const transcribedText = await this.smartEntryService.transcribeAudio(
          file.buffer,
          file.mimetype,
        );

        reqBody.text = transcribedText;
      } catch (error) {
        throw new InternalServerErrorException(
          'Opa, me perdi aqui! Pode enviar de novo?',
        );
      }
    }

    const [categories] = await this.categoryService.list({
      filter: { userId: user.id },
      pagination: {},
    });

    const generatedEntryData = await this.smartEntryService.generate({
      text: reqBody.text!,
      categories,
      now: new Date(reqBody.now),
    });

    if (!generatedEntryData)
      throw new InternalServerErrorException(
        'Opa, me perdi aqui! Pode enviar de novo?',
      );

    if (generatedEntryData.error) {
      throw new BadRequestException(generatedEntryData.error);
    }

    const entriesWithCategories: Entry[] = [];

    for (const generatedEntry of generatedEntryData.entries || []) {
      let category: Category | null = null;

      if (generatedEntry.category?.id) {
        category = await this.categoryService.findOneBy({
          id: generatedEntry.category.id,
          userId: user.id,
          type: generatedEntry.type || EntryTypes.Expense,
        });
      }

      const entry = this.entryService.createWithoutSaving({
        amount: generatedEntry.amount || 0,
        category,
        description: generatedEntry.description || '',
        type: generatedEntry.type || EntryTypes.Expense,
        when: generatedEntry.when
          ? new Date(generatedEntry.when)
          : new Date(reqBody.now),
        userId: user.id,
      });

      entriesWithCategories.push(entry);
    }

    return { entries: entriesWithCategories };
  }

  @Put(':id')
  async update(
    @AuthUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEntrySchema))
    body: z.infer<typeof UpdateEntrySchema>,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entry = await this.entryService.findOneBy({
        id,
        userId: user.id,
      });

      if (!entry) throw new NotFoundException('Lançamento não encontrado');

      let category = entry.category;

      if (body.category?.id) {
        category = await this.categoryService.findOneBy({
          id: body.category.id,
          userId: user.id,
          type: (body.type || entry.type),
        });

        if (!category) throw new NotFoundException('Categoria não encontrada');
      } else if (body.category === null) {
        category = null;
      }

      const updateData: any = { ...body };
      if (body.category !== undefined) {
        updateData.category = category;
      }

      const updatedEntry = await this.entryService.update(
        entry,
        updateData,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return { entry: updatedEntry };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  @Delete(':id')
  async destroy(@AuthUser() user: User, @Param('id') id: string) {
    const entry = await this.entryService.findOneBy({
      id,
      userId: user.id,
    });

    if (!entry) throw new NotFoundException('Lançamento não encontrado');

    await this.entryService.remove(entry);

    return { entry };
  }
}
