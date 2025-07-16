import prisma from "../prisma/client";

export const getAllYear = () => {
  return prisma.liturgicalYear.findMany({
    include: { news: true, readings: true },
  });
};

export const createYear = (data: {
  name: string;
  code: string;
  year: number;
  categoryId: number;
}) => {
  return prisma.liturgicalYear.create({ data });
};

export const deleteYear = (id: number) => {
  return prisma.liturgicalYear.delete({ where: { id } });
};
