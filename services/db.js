import pkg from "@prisma/client";
const { PrismaClient, Prisma } = pkg;

const prisma = new PrismaClient();
const PrismaError = Prisma.PrismaClientKnownRequestError;

export { prisma, PrismaError };