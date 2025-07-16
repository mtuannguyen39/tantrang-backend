import prisma from "../prisma/client";

export const getAllCategories = () => {
  return prisma.category.findMany({
    include: {
      news: true,
      bibleReadings: true,
      liturgicalYears: true,
      tntt: true,
    },
  });
};

export const createCategory = (data: { name: string; slug: string }) => {
  return prisma.category.create({ data });
};

export const deleteCategory = (id: number) => {
  return prisma.category.delete({ where: { id } });
};
