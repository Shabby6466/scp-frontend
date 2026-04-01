/**
 * Document type catalog — compliance checklist (program “Untitled-1” / master list).
 *
 * Sections mirrored here: **Child** (mandatory + optional), **Staff**, **Facility** (mandatory + optional).
 *
 * Schema / product gaps (no conditional enforcement in the app yet):
 * - **Lead screening (under 6):** Checklist is age-based; `Child` has no `dateOfBirth`, so this stays
 *   a single mandatory row until DOB (or equivalent) supports a conditional.
 * - **Dental certificate:** “Some programs” — modeled as optional.
 * - **MAT / EpiPen / food handler:** “If applicable” — modeled as optional until teacher-specific flags exist.
 */

import { PrismaClient, DocumentCategory, RenewalPeriod } from '@prisma/client';

export async function seedDocumentTypes(prisma: PrismaClient) {
  let sortOrder = 0;

  const childMandatory = [
    { name: 'CH-205 Child Health Examination Form', renewalPeriod: RenewalPeriod.ANNUAL },
    { name: 'Immunization Records (DTaP, Polio, MMR, Hep B, Varicella, PCV, Hib, Hep A, Flu)', renewalPeriod: RenewalPeriod.NONE },
    { name: 'Birth Certificate or proof of age', renewalPeriod: RenewalPeriod.NONE },
    { name: 'Proof of Residence (Document 1)', renewalPeriod: RenewalPeriod.NONE },
    { name: 'Proof of Residence (Document 2)', renewalPeriod: RenewalPeriod.NONE },
    { name: 'Emergency Contact and Authorized Pickup Form', renewalPeriod: RenewalPeriod.NONE },
    { name: 'OCFS-LDSS-7002 Medication Administration Consent', renewalPeriod: RenewalPeriod.NONE, isConditional: true, conditionField: 'takesMedsAtSchool' },
    { name: 'Allergy/Anaphylaxis Action Plan', renewalPeriod: RenewalPeriod.NONE, isConditional: true, conditionField: 'hasAllergies' },
    { name: 'Asthma Action Plan', renewalPeriod: RenewalPeriod.NONE, isConditional: true, conditionField: 'hasAsthma' },
    { name: 'Diabetes Care Plan', renewalPeriod: RenewalPeriod.NONE, isConditional: true, conditionField: 'hasDiabetes' },
    { name: 'Seizure Action Plan', renewalPeriod: RenewalPeriod.NONE, isConditional: true, conditionField: 'hasSeizures' },
    { name: 'Lead Screening Results', renewalPeriod: RenewalPeriod.NONE },
  ];

  for (const d of childMandatory) {
    await prisma.documentType.create({
      data: {
        name: d.name,
        category: DocumentCategory.CHILD,
        isMandatory: true,
        renewalPeriod: d.renewalPeriod,
        isConditional: !!d.isConditional,
        conditionField: d.conditionField ?? null,
        sortOrder: sortOrder++,
      },
    });
  }

  const childOptional = [
    'Dental Certificate',
    'Photo/Media Release Consent',
    'Field Trip Permission Forms',
    'Sunscreen/Insect Repellent Authorization',
    'Transportation Authorization',
    'Custody or Court Orders',
  ];

  for (const name of childOptional) {
    await prisma.documentType.create({
      data: {
        name,
        category: DocumentCategory.CHILD,
        isMandatory: false,
        renewalPeriod: RenewalPeriod.NONE,
        sortOrder: sortOrder++,
      },
    });
  }

  const staffDocs: Array<{
    name: string;
    appliesTo?: string[];
    renewalPeriod?: RenewalPeriod;
    isMandatory?: boolean;
  }> = [
    { name: 'Resume/CV', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'] },
    { name: "Copy of degree(s) - Bachelor's or Master's in ECE", appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER'] },
    { name: 'Teaching License or Certificate', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER'] },
    { name: 'High School Diploma or GED', appliesTo: ['PARAPROFESSIONAL'] },
    { name: 'Government-issued ID', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'] },
    { name: 'OCFS-6002 Qualifications Form', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'] },
    { name: '3 Reference Letters', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'] },
    { name: 'CBC (Comprehensive Background Check) clearance letter', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'] },
    { name: 'SCR clearance - LDSS-3370', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'] },
    { name: 'PETS active and eligible status', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'] },
    { name: 'SEL check - OCFS-6022', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'] },
    { name: 'Medical Clearance (TDap, MMR, Varicella immunity)', appliesTo: ['ED_DIRECTOR', 'LEAD_TEACHER', 'ASSISTANT_TEACHER', 'PARAPROFESSIONAL'], renewalPeriod: RenewalPeriod.BIENNIAL },
    { name: 'Mandated Reporter Certificate', renewalPeriod: RenewalPeriod.BIENNIAL },
    { name: 'Infectious Disease Training' },
    { name: 'Safety Plan and Emergency Procedures Training' },
    { name: 'SIDS/Safe Sleep/Shaken Baby Syndrome Training' },
    { name: 'Allergic Reaction Response Training' },
    { name: 'OSHA Bloodborne Pathogen Training' },
    { name: 'Pediatric CPR/First Aid', renewalPeriod: RenewalPeriod.BIENNIAL },
    { name: 'MAT - Medication Administration Training', isMandatory: false },
    { name: 'EpiPen Training', isMandatory: false },
    { name: 'Food Handler Certificate', isMandatory: false },
    { name: 'Staff Emergency Contact Form' },
    { name: 'Signed Acknowledgment of Safety Plan' },
    { name: 'Annual Performance Evaluation', renewalPeriod: RenewalPeriod.ANNUAL },
  ];

  for (const d of staffDocs) {
    await prisma.documentType.create({
      data: {
        name: d.name,
        category: DocumentCategory.STAFF,
        isMandatory: d.isMandatory !== false,
        renewalPeriod: d.renewalPeriod ?? RenewalPeriod.NONE,
        appliesToPositions: d.appliesTo ?? null,
        sortOrder: sortOrder++,
      },
    });
  }

  const facilityMandatory = [
    { name: 'DOH Group Child Care Permit (Article 47)', renewalPeriod: RenewalPeriod.ANNUAL },
    { name: 'Certificate of Occupancy' },
    { name: 'Written Safety Plan (Article 47 section 47.11)' },
    { name: 'FDNY Inspection Report / Fire Safety Certificate', renewalPeriod: RenewalPeriod.ANNUAL },
    { name: 'Fire Drill Log' },
    { name: 'Shelter-in-Place Drill Log' },
    { name: 'Lead Paint Inspection Report' },
    { name: 'Lead Water Testing Results' },
    { name: 'Asbestos Management Plan' },
    { name: 'General Liability Insurance Certificate' },
    { name: 'Workers Compensation Insurance' },
    { name: 'Health Department Inspection Reports' },
    { name: 'DOB Boiler Inspection' },
    { name: 'Pest Management/IPM Plan' },
  ];

  for (const d of facilityMandatory) {
    await prisma.documentType.create({
      data: {
        name: d.name,
        category: DocumentCategory.FACILITY,
        isMandatory: true,
        renewalPeriod: d.renewalPeriod ?? RenewalPeriod.NONE,
        sortOrder: sortOrder++,
      },
    });
  }

  const facilityOptional = [
    'Staff Handbook with signed acknowledgment',
    'Parent Handbook',
    'Emergency Evacuation Plan',
    'Vehicle Insurance and Inspection',
    'Food Service Permit',
  ];

  for (const name of facilityOptional) {
    await prisma.documentType.create({
      data: {
        name,
        category: DocumentCategory.FACILITY,
        isMandatory: false,
        renewalPeriod: RenewalPeriod.NONE,
        sortOrder: sortOrder++,
      },
    });
  }

  console.log(`Seeded ${sortOrder} document types`);
}
