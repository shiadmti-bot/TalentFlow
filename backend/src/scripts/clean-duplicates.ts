import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const areas = await prisma.area.findMany({
    include: { cargos: true }
  });

  const seen = new Map<string, string>(); // nome -> id to keep
  
  for (const area of areas) {
    if (seen.has(area.nome)) {
      const keepId = seen.get(area.nome)!;
      console.log(`Duplicate found for "${area.nome}". Keeping ${keepId}, processing ${area.id}...`);
      
      // Move all cargos from duplicate to the kept one
      for (const cargo of area.cargos) {
        console.log(`  Moving cargo ${cargo.nome} to ${keepId}`);
        await prisma.cargo.update({
          where: { id: cargo.id },
          data: { areaId: keepId }
        });
      }
      
      // Move all candidates that referenced this duplicate area
      await prisma.candidate.updateMany({
        where: { areaId: area.id },
        data: { areaId: keepId }
      });
      
      // Delete the duplicate
      await prisma.area.delete({
        where: { id: area.id }
      });
      console.log(`  Deleted duplicate area ${area.id}`);
    } else {
      seen.set(area.nome, area.id);
    }
  }

  console.log("Deduplication complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
