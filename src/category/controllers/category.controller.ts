import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { PaginationOptions } from '@/common/decorators/pagination.decorator';
import { Pagination } from '@/common/decorators/pagination.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User, UserRoles } from '@/user/entities/user.entity';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  UnprocessableEntityException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { CategoryService } from '../services/category.service';

const CreateCategorySchema = z
  .object({
    type: z.enum([EntryTypes.Income, EntryTypes.Expense]),
    name: z
      .string()
      .max(40, 'O nome da categoria deve ter no máximo 40 caracteres')
      .transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase())),
    limit: z
      .object({
        amount: z
          .number()
          .min(0.01, 'O valor do limite deve ser maior que zero'),
      })
      .nullable()
      .optional(),
  })
  .superRefine((body, ctx) => {
    if (body.type === EntryTypes.Expense) return;
    if (body.limit) {
      ctx.addIssue({
        path: ['limit'],
        message: 'Não é possível definir um limite para categorias de receita',
        code: z.ZodIssueCode.custom,
      });
    }
  });

const UpdateCategorySchema = z.object({
  name: z
    .string()
    .max(40, 'O nome da categoria deve ter no máximo 40 caracteres')
    .transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase()))
    .optional(),
  limit: z
    .object({
      id: z.string().optional(),
      amount: z.number().min(0.01, 'O valor do limite deve ser maior que zero'),
    })
    .nullable()
    .optional(),
});

@ApiTags('Category')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.User)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async index(
    @AuthUser() user: User,
    @Query('filter') queryFilter: any,
    @Pagination() pagination: PaginationOptions,
  ) {
    const requestFilter =
      typeof queryFilter === 'string'
        ? JSON.parse(queryFilter)
        : queryFilter || {};

    const [categories, count] = await this.categoryService.list({
      pagination: pagination.toQuery(),
      filter: {
        userId: user.id,
        when: {
          ge: requestFilter.when?.ge
            ? new Date(requestFilter.when.ge)
            : user.currentCycle.start,
          le: requestFilter.when?.le
            ? new Date(requestFilter.when.le)
            : user.currentCycle.end,
        },
      },
    });

    return {
      data: categories,
      meta: {
        ...pagination.toResponse(),
        count,
        pages: pagination.toQuery().take
          ? Math.ceil(count / pagination.toQuery().take!)
          : 1,
      },
    };
  }

  @Get(':id')
  async show(@AuthUser() user: User, @Param('id') id: string) {
    const category = await this.categoryService.findOneBy({
      id,
      userId: user.id,
    });

    if (!category) throw new NotFoundException('Categoria não encontrada');

    return { category };
  }

  @Post()
  async store(
    @AuthUser() user: User,
    @Body(new ZodValidationPipe(CreateCategorySchema))
    body: z.infer<typeof CreateCategorySchema>,
  ) {
    const categoryData: any = {
      ...body,
      userId: user.id,
    };

    if (body.limit) {
      categoryData.limit = {
        ...body.limit,
        userId: user.id,
      };
    }

    const category = await this.categoryService.create(categoryData);

    return { category };
  }

  @Put(':id')
  async update(
    @AuthUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCategorySchema))
    body: z.infer<typeof UpdateCategorySchema>,
  ) {
    const category = await this.categoryService.findOneBy({
      id,
      userId: user.id,
    });

    if (!category) throw new NotFoundException('Categoria não encontrada');

    if (category.type === EntryTypes.Income && body.limit) {
      throw new UnprocessableEntityException({
        errors: [
          {
            path: ['limit'],
            message:
              'Não é possível definir um limite para categorias de receita',
          },
        ],
      });
    }

    const updateData: any = { ...body };
    if (body.limit) {
      updateData.limit = {
        ...body.limit,
        userId: user.id,
      };
    }

    if (body.limit === null && category.limit) {
      await this.categoryService.removeLimit(category.id);
      updateData.limit = null;
    }

    const updatedCategory = await this.categoryService.update(
      category,
      updateData,
    );

    if (body.limit === null) {
      updatedCategory.limit = null;
    }

    return { category: updatedCategory };
  }

  @Delete(':id')
  async destroy(@AuthUser() user: User, @Param('id') id: string) {
    const category = await this.categoryService.findOneBy({
      id,
      userId: user.id,
    });

    if (!category) throw new NotFoundException('Categoria não encontrada');

    await this.categoryService.remove(category);

    return { message: 'Categoria removida' };
  }
}
