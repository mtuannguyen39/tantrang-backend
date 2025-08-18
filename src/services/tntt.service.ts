import prisma from "../prisma/client";

export const getAllTNTT = async () => {
  return prisma.tNTT.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const getTnttById = async (id: number) => {
  return prisma.tNTT.findUnique({ where: { id } });
};

export const createTntt = (data: {
  title: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  categoryId: number;
}) => {
  return prisma.tNTT.create({ data });
};

export const deleteTntt = (id: number) => {
  return prisma.tNTT.delete({ where: { id } });
};
