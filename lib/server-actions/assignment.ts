"use server";

import { db } from "@/lib/db";
import { crmServiceRequests, crmCustomerPlants, crmTechnicianAvailability, crmSkillMatrix, crmUsers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logBusinessEventActionInternal } from "./events";
import { sendNotificationActionInternal } from "./notifications";

export async function autoAssignTechnicianActionInternal(
  txOrDb: any,
  requestId: string
): Promise<boolean> {
  try {
    // 1. Fetch service request details
    const [request] = await txOrDb
      .select()
      .from(crmServiceRequests)
      .where(eq(crmServiceRequests.id, requestId))
      .limit(1);

    if (!request || request.assignedTo) {
      return false; // Already assigned or not found
    }

    if (!request.plantId) {
      return false; // No plant associated, cannot match city
    }

    // 2. Fetch Plant Details (for city matching)
    const [plant] = await txOrDb
      .select()
      .from(crmCustomerPlants)
      .where(eq(crmCustomerPlants.id, request.plantId))
      .limit(1);

    if (!plant || !plant.city) {
      return false;
    }

    const cityUpper = plant.city.toUpperCase();

    // 3. Find available technicians in this city
    const availableTechs = await txOrDb
      .select({
        userId: crmTechnicianAvailability.userId,
        city: crmTechnicianAvailability.city,
      })
      .from(crmTechnicianAvailability)
      .where(
        and(
          eq(crmTechnicianAvailability.city, plant.city),
          eq(crmTechnicianAvailability.isAvailable, true)
        )
      );

    if (availableTechs.length === 0) {
      console.warn(`[AutoAssignment] No available technicians found in city: ${plant.city}`);
      return false;
    }

    // 4. Perform skill matching
    // Look for equipment codes like "AX-125" in request title/description
    let matchingTechId: string | null = null;
    let selectedSkillDetail = "fallback_general";

    const searchStr = `${request.title} ${request.description}`.toUpperCase();

    // Fetch skill matrices for all available techs in the pool
    const techUserIds = availableTechs.map((t: any) => t.userId);
    
    // Query skills
    const skills = await txOrDb
      .select()
      .from(crmSkillMatrix)
      .where(
        and(
          // InArray manually or simple filter
          // Let's filter manually if inArray is complex
        )
      );

    // Filter skills linked to these tech IDs
    const techSkills = skills.filter((s: any) => techUserIds.includes(s.userId));

    // Try to find a technician with matching equipment skill
    for (const tech of availableTechs) {
      const personalSkills = techSkills.filter((s: any) => s.userId === tech.userId);
      
      // Match specific skill (e.g. AX-125)
      const specificSkill = personalSkills.find((s: any) => searchStr.includes(s.skill.toUpperCase()));
      
      if (specificSkill) {
        matchingTechId = tech.userId;
        selectedSkillDetail = `skill_match:${specificSkill.skill}:${specificSkill.certificationLevel}`;
        break;
      }
    }

    // If no specific skill matches, assign first available general tech
    if (!matchingTechId) {
      matchingTechId = availableTechs[0].userId;
    }

    // 5. Fetch tech name
    const [techUser] = await txOrDb
      .select()
      .from(crmUsers)
      .where(eq(crmUsers.id, matchingTechId as string))
      .limit(1);

    const techName = techUser?.fullName || "Técnico CYH";

    // 6. Update service request
    await txOrDb
      .update(crmServiceRequests)
      .set({
        assignedTo: matchingTechId,
        status: "asignada",
        updatedAt: new Date(),
      })
      .where(eq(crmServiceRequests.id, requestId));

    // 7. Log business event
    await logBusinessEventActionInternal(txOrDb, {
      eventType: "TICKET_AUTO_ASSIGNED",
      entityType: "service_request",
      entityId: requestId,
      status: "success",
      metadata: {
        techId: matchingTechId,
        techName,
        city: plant.city,
        matchingLogic: selectedSkillDetail,
      },
    });

    // 8. Trigger alert notifications
    await sendNotificationActionInternal(txOrDb, {
      customerId: request.customerId,
      userId: matchingTechId,
      eventType: "ticket_assigned",
      title: `🔧 Ticket Asignado Automáticamente: SR-${request.title.substring(0, 15)}`,
      message: `El ticket ha sido asignado automáticamente al técnico ${techName} en la ciudad de ${plant.city} basado en su Skill Matrix.`,
      severity: "info",
    });

    return true;
  } catch (err) {
    console.error("Auto assignment failure:", err);
    return false;
  }
}

export async function autoAssignTechnicianAction(requestId: string): Promise<boolean> {
  return autoAssignTechnicianActionInternal(db, requestId);
}
