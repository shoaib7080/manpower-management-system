import Employee from "../../modules/operations/models/Employee.js";

/**
 * Migration helper executed on startup:
 * 1. Sets documents.hsePassport.available = true for employees with an existing number or expiry date.
 * 2. Sets documents.cicpaPass.available = true for employees with an existing number or expiry date.
 * 3. Copies trainings.adnocInductionExpiry -> trainings.hseInductionExpiry if needed.
 * 4. Copies trainings.seaSurvivalExpiry -> trainings.tbosietExpiry if needed.
 */
export const migrateEmployeeDocuments = async () => {
  try {
    const employees = await Employee.find({});
    let updatedCount = 0;

    for (const emp of employees) {
      let changed = false;

      // HSE Passport Availability
      const hasHseNumber = Boolean(emp.documents?.hsePassport?.number?.trim());
      const hasHseExpiry = Boolean(emp.documents?.hsePassport?.expiry);
      if ((hasHseNumber || hasHseExpiry) && !emp.documents?.hsePassport?.available) {
        if (!emp.documents) emp.documents = {};
        if (!emp.documents.hsePassport) emp.documents.hsePassport = {};
        emp.documents.hsePassport.available = true;
        changed = true;
      }

      // CICPA Pass Availability
      const hasCicpaNumber = Boolean(emp.documents?.cicpaPass?.number?.trim());
      const hasCicpaExpiry = Boolean(emp.documents?.cicpaPass?.expiry);
      if ((hasCicpaNumber || hasCicpaExpiry) && !emp.documents?.cicpaPass?.available) {
        if (!emp.documents) emp.documents = {};
        if (!emp.documents.cicpaPass) emp.documents.cicpaPass = {};
        emp.documents.cicpaPass.available = true;
        changed = true;
      }

      // Training aliases migration
      if (emp.trainings?.adnocInductionExpiry && !emp.trainings?.hseInductionExpiry) {
        if (!emp.trainings) emp.trainings = {};
        emp.trainings.hseInductionExpiry = emp.trainings.adnocInductionExpiry;
        changed = true;
      }

      if (emp.trainings?.seaSurvivalExpiry && !emp.trainings?.tbosietExpiry) {
        if (!emp.trainings) emp.trainings = {};
        emp.trainings.tbosietExpiry = emp.trainings.seaSurvivalExpiry;
        changed = true;
      }

      if (changed) {
        await emp.save();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`Document availability migration: updated ${updatedCount} employee records.`);
    }
  } catch (error) {
    console.error("Error migrating employee document availability:", error.message);
  }
};
