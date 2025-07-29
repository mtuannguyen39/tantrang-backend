import prisma from "../prisma/client";

export const getAllYear = () => {
  return prisma.liturgicalYear.findMany({
    include: { news: true, readings: true },
  });
};

export const getYearById = (id: number) => {
  return prisma.liturgicalYear.findUnique({
    where: { id },
    include: { category: true },
  });
};

export const createYear = (data: {
  name: string;
  code: string;
  year: number;
  isFeatured: boolean;
  imageUrl: string;
  description: string;
  title: string;
  categoryId: number;
}) => {
  return prisma.liturgicalYear.create({ data });
};

export const deleteYear = (id: number) => {
  return prisma.liturgicalYear.delete({ where: { id } });
};
