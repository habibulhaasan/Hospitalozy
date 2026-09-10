"use client";

import SearchableSelect from "@/components/shared/SearchableSelect";
import React, { useState, useMemo, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ *
 * TEST MASTER — seed data
 *
 * Seeded from the hospital's own fee-schedule JSON (name + price +
 * sample type + rough department), covering Hematology, Biochemistry,
 * Blood Bank, Serology & Immunology, Endocrine/Hormones, Microbiology,
 * Histopathology & Cytology, Tumor Markers, and Urine & Stool.
 *
 * What the source JSON does NOT contain — and what's left blank here
 * for your staff to fill in through this screen — is reference
 * ranges/units and short names. `reportTemplate` and `category` are
 * auto-classified from the test name by keyword matching, which is a
 * reasonable starting point but not perfect (e.g. a few chemistry-ish
 * names may default to "Qualitative" when they're actually numeric,
 * and short names are just initials unless the original name already
 * had an abbreviation in parentheses). Treat the whole seed list as a
 * first draft to review, not a finished master — that reviewing is
 * exactly what this CRUD screen is for.
 * ------------------------------------------------------------------ */
const SEED_TESTS = [
  { id: "TST-00010", name: "TC, DC, ESR, Hemoglobin (combined)", shortName: "TDEH", category: "Hematology", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Multi-Parameter Panel)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 10 },
  { id: "TST-00020", name: "TC, DC, ESR, Hemoglobin (each separately)", shortName: "TDEH", category: "Hematology", price: 30, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Multi-Parameter Panel)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 20 },
  { id: "TST-00030", name: "VDRL Test", shortName: "V", category: "Serology & Immunology", price: 50, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 30 },
  { id: "TST-00040", name: "Circulating Eosinophil Count", shortName: "CEC", category: "Hematology", price: 20, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 40 },
  { id: "TST-00050", name: "SGPT", shortName: "S", category: "Biochemistry", price: 70, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 50 },
  { id: "TST-00060", name: "SGOT", shortName: "S", category: "Biochemistry", price: 70, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 60 },
  { id: "TST-00070", name: "Alkaline Phosphatase", shortName: "AP", category: "Biochemistry", price: 70, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 70 },
  { id: "TST-00080", name: "Uric Acid", shortName: "UA", category: "Biochemistry", price: 100, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 80 },
  { id: "TST-00090", name: "Serum Calcium", shortName: "SC", category: "Biochemistry", price: 80, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 90 },
  { id: "TST-00100", name: "Platelet", shortName: "P", category: "Hematology", price: 50, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 100 },
  { id: "TST-00110", name: "MP (Malaria Parasite)", shortName: "MMP", category: "Hematology", price: 20, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 110 },
  { id: "TST-00120", name: "Blood Culture", shortName: "BC", category: "Microbiology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 120, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 120 },
  { id: "TST-00130", name: "Urine Culture/Stool Culture/Other Culture", shortName: "UCSC", category: "Microbiology", price: 200, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 120, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 130 },
  { id: "TST-00140", name: "Gram Staining", shortName: "GS", category: "Microbiology", price: 30, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 48, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 140 },
  { id: "TST-00150", name: "AFB Staining", shortName: "AS", category: "Microbiology", price: 0, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 48, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 150 },
  { id: "TST-00160", name: "Slit Stain Smear for AFB", shortName: "SSSA", category: "Microbiology", price: 0, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 48, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 160 },
  { id: "TST-00170", name: "Fungus (R/M/E)", shortName: "R/M/E", category: "Microbiology", price: 30, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 48, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 170 },
  { id: "TST-00180", name: "Tuberculin Test", shortName: "T", category: "Microbiology", price: 100, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 48, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 180 },
  { id: "TST-00190", name: "Prothrombin Time (PT)", shortName: "PT", category: "Hematology", price: 100, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 190 },
  { id: "TST-00200", name: "Bone Marrow", shortName: "BM", category: "Hematology", price: 100, notes: "", sampleType: "Bone Marrow", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 200 },
  { id: "TST-00210", name: "Cytology (CSF)", shortName: "CSF", category: "Histopathology & Cytology", price: 100, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 210 },
  { id: "TST-00220", name: "LD Hide Test", shortName: "LH", category: "Biochemistry", price: 30, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 220 },
  { id: "TST-00230", name: "Urine Routine Examination", shortName: "URE", category: "Urine & Stool", price: 20, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 230 },
  { id: "TST-00240", name: "Urine Pregnancy Test", shortName: "UP", category: "Urine & Stool", price: 80, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 240 },
  { id: "TST-00250", name: "Stool Examination", shortName: "SE", category: "Urine & Stool", price: 20, notes: "", sampleType: "Stool", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 250 },
  { id: "TST-00260", name: "BT, CT", shortName: "BC", category: "Hematology", price: 30, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Multi-Parameter Panel)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 260 },
  { id: "TST-00270", name: "Lipid Profile", shortName: "LP", category: "Biochemistry", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 270 },
  { id: "TST-00280", name: "Blood Sugar", shortName: "BS", category: "Biochemistry", price: 60, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 280 },
  { id: "TST-00290", name: "Blood Urea", shortName: "BU", category: "Biochemistry", price: 50, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 290 },
  { id: "TST-00300", name: "Serum Bilirubin", shortName: "SB", category: "Biochemistry", price: 60, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 300 },
  { id: "TST-00310", name: "Serum Cholesterol", shortName: "SC", category: "Biochemistry", price: 50, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 310 },
  { id: "TST-00320", name: "Serum Creatinine", shortName: "SC", category: "Biochemistry", price: 50, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 320 },
  { id: "TST-00330", name: "Widal Test", shortName: "W", category: "Serology & Immunology", price: 80, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 330 },
  { id: "TST-00340", name: "ASO Titer", shortName: "AT", category: "Serology & Immunology", price: 100, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 340 },
  { id: "TST-00350", name: "RA Test", shortName: "R", category: "Serology & Immunology", price: 60, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 350 },
  { id: "TST-00360", name: "HBsAg", shortName: "H", category: "Serology & Immunology", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 360 },
  { id: "TST-00370", name: "Semen Analysis", shortName: "SA", category: "Serology & Immunology", price: 50, notes: "", sampleType: "Semen", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 370 },
  { id: "TST-00380", name: "Skin Scrap", shortName: "SS", category: "Biochemistry", price: 50, notes: "", sampleType: "Skin", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 380 },
  { id: "TST-00390", name: "GTT", shortName: "G", category: "Biochemistry", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 390 },
  { id: "TST-00400", name: "HbA1c", shortName: "HC", category: "Biochemistry", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 400 },
  { id: "TST-00410", name: "Albumin Globulin Ratio", shortName: "AGR", category: "Biochemistry", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 410 },
  { id: "TST-00420", name: "Serum CK (CPK)", shortName: "CPK", category: "Biochemistry", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 420 },
  { id: "TST-00430", name: "Serum CKMB", shortName: "SC", category: "Biochemistry", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 430 },
  { id: "TST-00440", name: "Serum Electrolyte", shortName: "SE", category: "Biochemistry", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 440 },
  { id: "TST-00450", name: "Serum LDH", shortName: "SL", category: "Biochemistry", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 450 },
  { id: "TST-00460", name: "Serum HDL (Cholesterol)", shortName: "SHC", category: "Biochemistry", price: 100, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 460 },
  { id: "TST-00470", name: "Serum LDL (Cholesterol)", shortName: "SLC", category: "Biochemistry", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 470 },
  { id: "TST-00480", name: "TCO2", shortName: "T", category: "Biochemistry", price: 50, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 480 },
  { id: "TST-00490", name: "Liver Function Test", shortName: "LF", category: "Biochemistry", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 490 },
  { id: "TST-00500", name: "Gamma GT", shortName: "GG", category: "Biochemistry", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 500 },
  { id: "TST-00510", name: "Blood Gas Analysis", shortName: "BGA", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 510 },
  { id: "TST-00520", name: "Lithium", shortName: "L", category: "Biochemistry", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 520 },
  { id: "TST-00530", name: "Inorganic Phosphate", shortName: "IP", category: "Biochemistry", price: 100, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 530 },
  { id: "TST-00540", name: "Serum Iron", shortName: "SI", category: "Biochemistry", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 540 },
  { id: "TST-00550", name: "Total Iron Binding Capacity", shortName: "TIBC", category: "Biochemistry", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 550 },
  { id: "TST-00560", name: "Serum Creatine", shortName: "SC", category: "Biochemistry", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 560 },
  { id: "TST-00570", name: "Aldolase", shortName: "A", category: "Biochemistry", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 570 },
  { id: "TST-00580", name: "Alpha Amylase", shortName: "AA", category: "Biochemistry", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 580 },
  { id: "TST-00590", name: "Urine for Bence-Jones Protein", shortName: "UBJP", category: "Urine & Stool", price: 40, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 590 },
  { id: "TST-00600", name: "Urine for pH", shortName: "UP", category: "Urine & Stool", price: 40, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 600 },
  { id: "TST-00610", name: "24 Hour Urine Protein", shortName: "HUP", category: "Urine & Stool", price: 175, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 610 },
  { id: "TST-00620", name: "24 Hour Urine Sodium", shortName: "HUS", category: "Urine & Stool", price: 175, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 620 },
  { id: "TST-00630", name: "24 Hour Urine Potassium", shortName: "HUP", category: "Urine & Stool", price: 175, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 630 },
  { id: "TST-00640", name: "24 Hour Urine Calcium", shortName: "HUC", category: "Urine & Stool", price: 175, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 640 },
  { id: "TST-00650", name: "24 Hour Urine Uric Acid", shortName: "HUUA", category: "Urine & Stool", price: 175, notes: "", sampleType: "Urine", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 650 },
  { id: "TST-00660", name: "CCR", shortName: "C", category: "Biochemistry", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 660 },
  { id: "TST-00670", name: "Body Fluid Biochemical Test", shortName: "BFB", category: "Biochemistry", price: 100, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 670 },
  { id: "TST-00680", name: "Cardiac Troponin", shortName: "CT", category: "Biochemistry", price: 500, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 680 },
  { id: "TST-00690", name: "Screening", shortName: "S", category: "Blood Bank", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 690 },
  { id: "TST-00700", name: "Grouping", shortName: "G", category: "Blood Bank", price: 50, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 700 },
  { id: "TST-00710", name: "Rh Factor", shortName: "RF", category: "Blood Bank", price: 50, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 710 },
  { id: "TST-00720", name: "Cross Matching", shortName: "CM", category: "Blood Bank", price: 100, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 720 },
  { id: "TST-00730", name: "Antibody Detection Charge", shortName: "ADC", category: "Blood Bank", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 730 },
  { id: "TST-00740", name: "Antibody Titer", shortName: "AT", category: "Blood Bank", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 740 },
  { id: "TST-00750", name: "HIV", shortName: "H", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 750 },
  { id: "TST-00760", name: "General Ward Patient - Screening, Grouping, Crossmatching for blood/products", shortName: "GWPS", category: "Blood Bank", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 760 },
  { id: "TST-00770", name: "Paying Ward/Bed Patient - same", shortName: "PWBP", category: "Blood Bank", price: 350, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 770 },
  { id: "TST-00780", name: "Cabin Patient - same", shortName: "CPS", category: "Blood Bank", price: 500, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 780 },
  { id: "TST-00790", name: "Day Care Patient - same", shortName: "DCPS", category: "Blood Bank", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 790 },
  { id: "TST-00800", name: "Private Patient - same", shortName: "PPS", category: "Blood Bank", price: 500, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 2, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 800 },
  { id: "TST-00810", name: "C3", shortName: "C", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 810 },
  { id: "TST-00820", name: "C4", shortName: "C", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 820 },
  { id: "TST-00830", name: "Anti-DNA Antibody", shortName: "ADA", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 830 },
  { id: "TST-00840", name: "Anti-HBe", shortName: "AH", category: "Serology & Immunology", price: 450, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 840 },
  { id: "TST-00850", name: "Anti-HBs", shortName: "AH", category: "Serology & Immunology", price: 450, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 850 },
  { id: "TST-00860", name: "Anti-HBc IgM", shortName: "AHI", category: "Serology & Immunology", price: 450, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 860 },
  { id: "TST-00870", name: "Anti-HBc", shortName: "AH", category: "Serology & Immunology", price: 350, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 870 },
  { id: "TST-00880", name: "Anti-HCV", shortName: "AH", category: "Serology & Immunology", price: 450, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 880 },
  { id: "TST-00890", name: "Anti-HCV (Western Blot/ELISA)", shortName: "AHWB", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 890 },
  { id: "TST-00900", name: "Anti-HEV IgM", shortName: "AHI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 900 },
  { id: "TST-00910", name: "Anti-HAV IgM", shortName: "AHI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 910 },
  { id: "TST-00920", name: "Anti-Toxo IgM", shortName: "ATI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 920 },
  { id: "TST-00930", name: "Anti-Toxo IgG", shortName: "ATI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 930 },
  { id: "TST-00940", name: "Anti-Rubella IgG", shortName: "ARI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 940 },
  { id: "TST-00950", name: "Anti-Rubella IgM", shortName: "ARI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 950 },
  { id: "TST-00960", name: "HIV (1+2+O) Rapid", shortName: "HOR", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 960 },
  { id: "TST-00970", name: "HIV (1+2+O) ELISA", shortName: "HOE", category: "Serology & Immunology", price: 400, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 970 },
  { id: "TST-00980", name: "EBV IgM", shortName: "EI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 980 },
  { id: "TST-00990", name: "Chlamydia Antigen (ICT)", shortName: "ICT", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 168, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 990 },
  { id: "TST-01000", name: "Chlamydia Antibody (IgG)", shortName: "CAI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 168, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1000 },
  { id: "TST-01010", name: "Serum IgA", shortName: "SI", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1010 },
  { id: "TST-01020", name: "Serum IgG", shortName: "SI", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1020 },
  { id: "TST-01030", name: "Serum IgM", shortName: "SI", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1030 },
  { id: "TST-01040", name: "TPHA", shortName: "T", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1040 },
  { id: "TST-01050", name: "Rheumatoid Factor", shortName: "RF", category: "Serology & Immunology", price: 70, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1050 },
  { id: "TST-01060", name: "CRP (C-reactive Protein)", shortName: "CCRP", category: "Serology & Immunology", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1060 },
  { id: "TST-01070", name: "P-ANCA", shortName: "PA", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1070 },
  { id: "TST-01080", name: "C-ANCA", shortName: "CA", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1080 },
  { id: "TST-01090", name: "ANF", shortName: "A", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1090 },
  { id: "TST-01100", name: "ANA", shortName: "A", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1100 },
  { id: "TST-01110", name: "PS", shortName: "P", category: "Biochemistry", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1110 },
  { id: "TST-01120", name: "Dengue", shortName: "D", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1120 },
  { id: "TST-01130", name: "CMV IgG", shortName: "CI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1130 },
  { id: "TST-01140", name: "CMV IgM", shortName: "CI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1140 },
  { id: "TST-01150", name: "AFP", shortName: "A", category: "Tumor Marker", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1150 },
  { id: "TST-01160", name: "CEA", shortName: "C", category: "Tumor Marker", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1160 },
  { id: "TST-01170", name: "HSV-1 IgM", shortName: "HI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1170 },
  { id: "TST-01180", name: "HSV-1 IgG", shortName: "HI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1180 },
  { id: "TST-01190", name: "HSV-2 IgM", shortName: "HI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1190 },
  { id: "TST-01200", name: "HSV-2 IgG", shortName: "HI", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1200 },
  { id: "TST-01210", name: "TPHA (duplicate entry)", shortName: "TDE", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1210 },
  { id: "TST-01220", name: "Anti-Thyroglobulin Ab", shortName: "ATA", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1220 },
  { id: "TST-01230", name: "Anti-Thyroid Peroxidase", shortName: "ATP", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1230 },
  { id: "TST-01240", name: "Anti-Cardiolipin IgM", shortName: "ACI", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1240 },
  { id: "TST-01250", name: "Anti-Cardiolipin IgG", shortName: "ACI", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1250 },
  { id: "TST-01260", name: "Anti-Cardiolipin IgA", shortName: "ACI", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1260 },
  { id: "TST-01270", name: "Beta-2 Microglobulin", shortName: "BM", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1270 },
  { id: "TST-01280", name: "Anti-Toxoplasma Ab", shortName: "ATA", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1280 },
  { id: "TST-01290", name: "Anti-TB IgG", shortName: "ATI", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1290 },
  { id: "TST-01300", name: "Anti-TB IgA", shortName: "ATI", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1300 },
  { id: "TST-01310", name: "Mycology", shortName: "M", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1310 },
  { id: "TST-01320", name: "Acanthamoeba Ab (IFA)", shortName: "IFA", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1320 },
  { id: "TST-01330", name: "CFT for Filaria/Kala-azar", shortName: "CFKA", category: "Serology & Immunology", price: 80, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1330 },
  { id: "TST-01340", name: "ICT for Filaria/Kala-azar/Malaria", shortName: "IFKA", category: "Serology & Immunology", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1340 },
  { id: "TST-01350", name: "Rose Waaler Test", shortName: "RW", category: "Biochemistry", price: 80, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1350 },
  { id: "TST-01360", name: "Brucella Ab", shortName: "BA", category: "Serology & Immunology", price: 70, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1360 },
  { id: "TST-01370", name: "Rickettsial Ab Weil-Felix Antigen", shortName: "RAWF", category: "Serology & Immunology", price: 70, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1370 },
  { id: "TST-01380", name: "Weil-Felix Antigen", shortName: "WFA", category: "Serology & Immunology", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1380 },
  { id: "TST-01390", name: "LDLB", shortName: "L", category: "Serology & Immunology", price: 30, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1390 },
  { id: "TST-01400", name: "Microfilaria", shortName: "M", category: "Serology & Immunology", price: 30, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1400 },
  { id: "TST-01410", name: "Beta-HCG", shortName: "BH", category: "Tumor Marker", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1410 },
  { id: "TST-01420", name: "CA-125", shortName: "C", category: "Tumor Marker", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1420 },
  { id: "TST-01430", name: "CA-15.3", shortName: "C", category: "Tumor Marker", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1430 },
  { id: "TST-01440", name: "CA-19.9", shortName: "C", category: "Tumor Marker", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1440 },
  { id: "TST-01450", name: "CA-242", shortName: "C", category: "Tumor Marker", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1450 },
  { id: "TST-01460", name: "Vagatoxin", shortName: "V", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1460 },
  { id: "TST-01470", name: "Vasproic Acid", shortName: "VA", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1470 },
  { id: "TST-01480", name: "Anti-HDD", shortName: "AH", category: "Serology & Immunology", price: 300, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1480 },
  { id: "TST-01490", name: "T3", shortName: "T", category: "Endocrine / Hormones", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1490 },
  { id: "TST-01500", name: "T4", shortName: "T", category: "Endocrine / Hormones", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1500 },
  { id: "TST-01510", name: "TSH", shortName: "T", category: "Endocrine / Hormones", price: 200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1510 },
  { id: "TST-01520", name: "FT3", shortName: "F", category: "Endocrine / Hormones", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1520 },
  { id: "TST-01530", name: "FT4", shortName: "F", category: "Endocrine / Hormones", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1530 },
  { id: "TST-01540", name: "LH", shortName: "L", category: "Biochemistry", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1540 },
  { id: "TST-01550", name: "Prolactin", shortName: "P", category: "Endocrine / Hormones", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1550 },
  { id: "TST-01560", name: "Estrogen", shortName: "E", category: "Endocrine / Hormones", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1560 },
  { id: "TST-01570", name: "Progesterone", shortName: "P", category: "Endocrine / Hormones", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1570 },
  { id: "TST-01580", name: "Testosterone", shortName: "T", category: "Endocrine / Hormones", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1580 },
  { id: "TST-01590", name: "ACTH", shortName: "A", category: "Endocrine / Hormones", price: 400, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1590 },
  { id: "TST-01600", name: "PTH", shortName: "P", category: "Endocrine / Hormones", price: 400, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1600 },
  { id: "TST-01610", name: "Calcitonin", shortName: "C", category: "Endocrine / Hormones", price: 400, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1610 },
  { id: "TST-01620", name: "Growth Hormone", shortName: "GH", category: "Endocrine / Hormones", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1620 },
  { id: "TST-01630", name: "Cortisol", shortName: "C", category: "Endocrine / Hormones", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1630 },
  { id: "TST-01640", name: "HLA Typing (A and B)", shortName: "HTB", category: "Serology & Immunology", price: 1200, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 168, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1640 },
  { id: "TST-01650", name: "HLA Cross Match", shortName: "HCM", category: "Serology & Immunology", price: 450, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 168, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1650 },
  { id: "TST-01660", name: "HLA-B27", shortName: "HB", category: "Serology & Immunology", price: 650, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 168, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1660 },
  { id: "TST-01670", name: "HLA-AB", shortName: "HA", category: "Serology & Immunology", price: 6000, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 168, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1670 },
  { id: "TST-01680", name: "HLA-DR", shortName: "HD", category: "Serology & Immunology", price: 4000, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 168, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1680 },
  { id: "TST-01690", name: "HLA-DQ", shortName: "HD", category: "Serology & Immunology", price: 4000, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 168, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1690 },
  { id: "TST-01700", name: "PSA", shortName: "P", category: "Tumor Marker", price: 250, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Numeric (Single Value)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1700 },
  { id: "TST-01710", name: "Leishmania Culture", shortName: "LC", category: "Microbiology", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 120, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1710 },
  { id: "TST-01720", name: "Fungus Culture", shortName: "FC", category: "Microbiology", price: 150, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 120, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1720 },
  { id: "TST-01730", name: "Anti-HP Pylori", shortName: "AHP", category: "Serology & Immunology", price: 400, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 24, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1730 },
  { id: "TST-01740", name: "Identification of AFB in Sputum and Other Body Fluid by PCR", shortName: "IASO", category: "Microbiology", price: 1800, notes: "", sampleType: "Sputum", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 48, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1740 },
  { id: "TST-01750", name: "Small Biopsy Specimen", shortName: "SBS", category: "Histopathology & Cytology", price: 150, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1750 },
  { id: "TST-01760", name: "Kidney Biopsy Specimen (Special Stain)", shortName: "KBSS", category: "Histopathology & Cytology", price: 200, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1760 },
  { id: "TST-01770", name: "Kidney Biopsy Specimen (Each Special Stain)", shortName: "KBSS", category: "Histopathology & Cytology", price: 150, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1770 },
  { id: "TST-01780", name: "Large Specimen", shortName: "LS", category: "Histopathology & Cytology", price: 300, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1780 },
  { id: "TST-01790", name: "Fluid (Pleural/Peritoneal/CSF) Cytology", shortName: "FPPC", category: "Histopathology & Cytology", price: 100, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1790 },
  { id: "TST-01800", name: "Cervical Smear, Body Fluid Sputum", shortName: "CSBF", category: "Biochemistry", price: 150, notes: "", sampleType: "Sputum", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1800 },
  { id: "TST-01810", name: "FNAC (superficial organ e.g. lymph node incl. aspiration charge)", shortName: "FSOG", category: "Histopathology & Cytology", price: 150, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1810 },
  { id: "TST-01820", name: "FNAC (deep organ e.g. liver)", shortName: "FDOG", category: "Histopathology & Cytology", price: 200, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1820 },
  { id: "TST-01830", name: "Image Guided FNAC (USG)", shortName: "USG", category: "Histopathology & Cytology", price: 400, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1830 },
  { id: "TST-01840", name: "Frozen Section", shortName: "FS", category: "Histopathology & Cytology", price: 500, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1840 },
  { id: "TST-01850", name: "Prepared Slide/Block (each)", shortName: "PSB", category: "Histopathology & Cytology", price: 50, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1850 },
  { id: "TST-01860", name: "Direct Immunofluorescence", shortName: "DI", category: "Histopathology & Cytology", price: 300, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1860 },
  { id: "TST-01870", name: "Comment (DPWBF)", shortName: "DPWBF", category: "Histopathology & Cytology", price: 100, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1870 },
  { id: "TST-01880", name: "HET", shortName: "H", category: "Histopathology & Cytology", price: 80, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1880 },
  { id: "TST-01890", name: "PTT", shortName: "P", category: "Histopathology & Cytology", price: 150, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1890 },
  { id: "TST-01900", name: "Cytology (CSF and Fluid)", shortName: "CCF", category: "Histopathology & Cytology", price: 100, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1900 },
  { id: "TST-01910", name: "Fluid Cytology for Malignant Cell", shortName: "FCMC", category: "Histopathology & Cytology", price: 150, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1910 },
  { id: "TST-01920", name: "NAC", shortName: "N", category: "Histopathology & Cytology", price: 400, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1920 },
  { id: "TST-01930", name: "CT Guided FNAC (one film)", shortName: "CGFO", category: "Histopathology & Cytology", price: 2000, notes: "", sampleType: "Tissue/Biopsy", active: true, searchVisible: true, reportTemplate: "Narrative (Free Text Report)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 72, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1930 },
  { id: "TST-01940", name: "Tumor Marker", shortName: "TM", category: "Tumor Marker", price: 350, notes: "", sampleType: "Blood", active: true, searchVisible: true, reportTemplate: "Qualitative (Text Result)", unit: "", referenceType: "qualitative", refUnisex: ["", ""], refMale: ["", ""], refFemale: ["", ""], refChild: ["", ""], normalText: "", turnaroundHours: 6, fastingRequired: false, synonyms: "", specimenContainer: "", displayOrder: 1940 },
];

const CATEGORIES = [
  "Hematology",
  "Biochemistry",
  "Blood Bank",
  "Serology & Immunology",
  "Endocrine / Hormones",
  "Microbiology",
  "Histopathology & Cytology",
  "Tumor Marker",
  "Urine & Stool",
];

const SAMPLE_TYPES = [
  "Blood", "Urine", "Stool", "Sputum", "Semen", "Skin", "Tissue/Biopsy",
  "Bone Marrow", "CSF", "Body Fluid", "Swab", "Nail/Hair",
];

const REPORT_TEMPLATES = [
  "Numeric (Single Value)",
  "Numeric (Multi-Parameter Panel)",
  "Qualitative (Text Result)",
  "Narrative (Free Text Report)",
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function generateTestId() {
  return `TST-${Date.now().toString().slice(-8)}`;
}

const BLANK_TEST = {
  id: "",
  name: "",
  shortName: "",
  category: "",
  price: "",
  notes: "",
  sampleType: "",
  active: true,
  searchVisible: true,
  reportTemplate: "Numeric (Single Value)",
  unit: "",
  referenceType: "qualitative", // "qualitative" | "unisex" | "sexSplit" | "withChild"
  refUnisex: ["", ""],
  refMale: ["", ""],
  refFemale: ["", ""],
  refChild: ["", ""],
  normalText: "",
  turnaroundHours: 24,
  fastingRequired: false,
  synonyms: "",
  specimenContainer: "",
  displayOrder: 0,
};

/* ------------------------------------------------------------------ *
 * Single-value searchable dropdown (combobox) — same pattern as the
 * other components in this project. Free typing is accepted as the
 * value even if it isn't in the option list.
 * ------------------------------------------------------------------ */
// SearchableSelect is now imported from @/components/shared/SearchableSelect


/**
 * Firebase hookup — same backend-agnostic pattern as the lab report,
 * invoice, and doctor components in this project.
 *
 *   onLoadTests() => return the full array of test records (shape
 *     matches BLANK_TEST) to populate the list on mount. Defaults to
 *     SEED_TESTS so the screen is useful standalone before you've
 *     wired up a real backend — once you have, have this prop read
 *     from Firestore instead and it takes over.
 *
 *   onSaveTest(testData) => create if testData.id is empty (assign
 *     and return a new id), or update the existing record if it's
 *     already set. Return the saved object either way.
 *
 *   onDeleteTest(id) => delete the record.
 *
 * The Lab Report / Invoice / Doctor components in this project can
 * all read their own catalogs from this same master instead of their
 * built-in seed arrays, once this is backed by a real database —
 * that's the point of having one master list instead of three.
 */
export default function TestMasterComponent({
  onLoadTests = async () => SEED_TESTS,
  onSaveTest = async (testData) => ({ ...testData, id: testData.id || generateTestId() }),
  onDeleteTest = async () => true,
} = {}) {
  const [tests, setTests] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading"); // "loading" | "loaded" | "error"

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // "All" | "Active" | "Inactive"

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(BLANK_TEST);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "error"

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    onLoadTests()
      .then((list) => {
        setTests(Array.isArray(list) ? list : []);
        setLoadStatus("loaded");
      })
      .catch(() => setLoadStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tests
      .filter((t) => {
        const matchesTerm =
          !term ||
          t.name.toLowerCase().includes(term) ||
          (t.shortName || "").toLowerCase().includes(term) ||
          (t.synonyms || "").toLowerCase().includes(term);
        const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
        const matchesStatus =
          statusFilter === "All" || (statusFilter === "Active" ? t.active : !t.active);
        return matchesTerm && matchesCategory && matchesStatus;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0) || a.name.localeCompare(b.name));
  }, [tests, search, categoryFilter, statusFilter]);

  function openAddModal() {
    const nextOrder = tests.length ? Math.max(...tests.map((t) => t.displayOrder || 0)) + 10 : 10;
    setDraft({ ...BLANK_TEST, id: "", displayOrder: nextOrder });
    setSaveStatus("");
    setModalOpen(true);
  }
  function openEditModal(t) {
    setDraft({ ...BLANK_TEST, ...t });
    setSaveStatus("");
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setDraft(BLANK_TEST);
    setSaveStatus("");
  }

  async function handleSaveTest() {
    if (!draft.name.trim()) return;
    setSaveStatus("saving");
    try {
      const saved = await onSaveTest(draft);
      setTests((prev) => {
        const exists = prev.some((t) => t.id === saved.id);
        return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved];
      });
      closeModal();
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  async function handleDeleteTest(id) {
    try {
      await onDeleteTest(id);
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
    setConfirmDeleteId(null);
  }

  async function toggleField(t, field) {
    const updated = { ...t, [field]: !t[field] };
    setTests((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
    try {
      await onSaveTest(updated);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Laboratory Test Master</h1>
            <p className="text-xs text-slate-500">{tests.length} test{tests.length !== 1 ? "s" : ""} on record</p>
          </div>
          <button onClick={openAddModal} className="text-sm bg-slate-800 text-white px-4 py-2 rounded font-medium">
            + Add Test
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-wrap gap-2 items-center">
          <input
            className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[200px]"
            placeholder="Search by name, short name, or synonym"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1.5 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          {loadStatus === "loading" && <div className="p-6 text-center text-sm text-slate-400">Loading tests…</div>}
          {loadStatus === "error" && <div className="p-6 text-center text-sm text-red-500">Couldn't load the test list — check the connection.</div>}
          {loadStatus === "loaded" && filteredTests.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">
              {tests.length === 0 ? "No tests added yet — click \"+ Add Test\" to get started." : "No tests match this search/filter."}
            </div>
          )}
          {loadStatus === "loaded" && filteredTests.length > 0 && (
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 font-medium w-12">Order</th>
                  <th className="py-2 px-3 font-medium">Test Name</th>
                  <th className="py-2 px-3 font-medium">Short</th>
                  <th className="py-2 px-3 font-medium">Category</th>
                  <th className="py-2 px-3 font-medium">Sample</th>
                  <th className="py-2 px-3 font-medium text-right">Price</th>
                  <th className="py-2 px-3 font-medium">Template</th>
                  <th className="py-2 px-3 font-medium">Active</th>
                  <th className="py-2 px-3 font-medium">Search-Visible</th>
                  <th className="py-2 px-3 font-medium w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((t) => (
                  <tr key={t.id} className={`border-b border-slate-100 align-top ${!t.active ? "opacity-50" : ""}`}>
                    <td className="py-2 px-3 text-xs text-slate-400">{t.displayOrder}</td>
                    <td className="py-2 px-3 font-medium">
                      {t.name}
                      {t.notes && <div className="text-[10px] text-slate-400 font-normal">{t.notes}</div>}
                    </td>
                    <td className="py-2 px-3 text-xs">{t.shortName || "—"}</td>
                    <td className="py-2 px-3">{t.category || "—"}</td>
                    <td className="py-2 px-3">{t.sampleType || "—"}</td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">৳{Number(t.price || 0).toLocaleString("en-BD")}</td>
                    <td className="py-2 px-3 text-xs">{t.reportTemplate}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => toggleField(t, "active")} className={`text-[10px] px-2 py-0.5 rounded-full ${t.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {t.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <button onClick={() => toggleField(t, "searchVisible")} className={`text-[10px] px-2 py-0.5 rounded-full ${t.searchVisible ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {t.searchVisible ? "Visible" : "Hidden"}
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(t)} className="text-xs text-slate-500 hover:text-slate-800">Edit</button>
                        {confirmDeleteId === t.id ? (
                          <span className="flex items-center gap-1 text-xs bg-red-50 border border-red-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                            <button onClick={() => handleDeleteTest(t.id)} className="text-red-700 font-semibold underline">Yes</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-slate-500 underline">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(t.id)} className="text-xs text-slate-400 hover:text-red-500">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============ ADD / EDIT MODAL ============ */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold">{draft.id ? "Edit Test" : "Add Test"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="p-5 space-y-3">
              {draft.id && <div className="text-xs text-slate-400">Test ID: <span className="font-mono">{draft.id}</span></div>}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs text-slate-500 block mb-1">Test Name *</label>
                  <input
                    className="border rounded px-2 py-1.5 text-sm w-full"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Short Name</label>
                  <input
                    className="border rounded px-2 py-1.5 text-sm w-full"
                    placeholder="e.g. CBC"
                    value={draft.shortName}
                    onChange={(e) => setDraft({ ...draft, shortName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Category</label>
                  <SearchableSelect
                    value={draft.category}
                    onChange={(v) => setDraft({ ...draft, category: v })}
                    options={CATEGORIES}
                    placeholder="Search or type"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Sample Type</label>
                  <SearchableSelect
                    value={draft.sampleType}
                    onChange={(v) => setDraft({ ...draft, sampleType: v })}
                    options={SAMPLE_TYPES}
                    placeholder="Search or type"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Price (৳) *</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1.5 text-sm w-full"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Fluctuates over time — update here whenever it changes.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Turnaround (hours)</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1.5 text-sm w-full"
                    value={draft.turnaroundHours}
                    onChange={(e) => setDraft({ ...draft, turnaroundHours: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Display Order</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1.5 text-sm w-full"
                    value={draft.displayOrder}
                    onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Report Template</label>
                <SearchableSelect
                  value={draft.reportTemplate}
                  onChange={(v) => setDraft({ ...draft, reportTemplate: v })}
                  options={REPORT_TEMPLATES}
                  placeholder="Search or type"
                />
              </div>

              {/* ---- Unit / Reference configuration ---- */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="text-xs font-semibold text-slate-600 mb-2">Unit / Reference Configuration</div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Unit</label>
                    <input
                      className="border rounded px-2 py-1.5 text-sm w-full bg-white"
                      placeholder="e.g. g/dL, mg/dL, /µL"
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Reference Type</label>
                    <select
                      className="border rounded px-2 py-1.5 text-sm w-full bg-white"
                      value={draft.referenceType}
                      onChange={(e) => setDraft({ ...draft, referenceType: e.target.value })}
                    >
                      <option value="qualitative">Qualitative / Narrative (no numeric range)</option>
                      <option value="unisex">Single Range (all patients)</option>
                      <option value="sexSplit">Male / Female Split</option>
                      <option value="withChild">Male / Female / Child</option>
                    </select>
                  </div>
                </div>

                {draft.referenceType === "qualitative" && (
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Expected / Normal Text</label>
                    <input
                      className="border rounded px-2 py-1.5 text-sm w-full bg-white"
                      placeholder="e.g. Negative, Nil, No growth"
                      value={draft.normalText}
                      onChange={(e) => setDraft({ ...draft, normalText: e.target.value })}
                    />
                  </div>
                )}

                {draft.referenceType === "unisex" && (
                  <div className="flex gap-2 items-center">
                    <input
                      className="border rounded px-2 py-1.5 text-sm w-24 bg-white"
                      placeholder="Low"
                      value={draft.refUnisex[0]}
                      onChange={(e) => setDraft({ ...draft, refUnisex: [e.target.value, draft.refUnisex[1]] })}
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      className="border rounded px-2 py-1.5 text-sm w-24 bg-white"
                      placeholder="High"
                      value={draft.refUnisex[1]}
                      onChange={(e) => setDraft({ ...draft, refUnisex: [draft.refUnisex[0], e.target.value] })}
                    />
                    <span className="text-xs text-slate-400">{draft.unit}</span>
                  </div>
                )}

                {(draft.referenceType === "sexSplit" || draft.referenceType === "withChild") && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-slate-500 w-14">Male</span>
                      <input
                        className="border rounded px-2 py-1.5 text-sm w-24 bg-white"
                        placeholder="Low"
                        value={draft.refMale[0]}
                        onChange={(e) => setDraft({ ...draft, refMale: [e.target.value, draft.refMale[1]] })}
                      />
                      <span className="text-slate-400">–</span>
                      <input
                        className="border rounded px-2 py-1.5 text-sm w-24 bg-white"
                        placeholder="High"
                        value={draft.refMale[1]}
                        onChange={(e) => setDraft({ ...draft, refMale: [draft.refMale[0], e.target.value] })}
                      />
                      <span className="text-xs text-slate-400">{draft.unit}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-slate-500 w-14">Female</span>
                      <input
                        className="border rounded px-2 py-1.5 text-sm w-24 bg-white"
                        placeholder="Low"
                        value={draft.refFemale[0]}
                        onChange={(e) => setDraft({ ...draft, refFemale: [e.target.value, draft.refFemale[1]] })}
                      />
                      <span className="text-slate-400">–</span>
                      <input
                        className="border rounded px-2 py-1.5 text-sm w-24 bg-white"
                        placeholder="High"
                        value={draft.refFemale[1]}
                        onChange={(e) => setDraft({ ...draft, refFemale: [draft.refFemale[0], e.target.value] })}
                      />
                      <span className="text-xs text-slate-400">{draft.unit}</span>
                    </div>
                    {draft.referenceType === "withChild" && (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-slate-500 w-14">Child</span>
                        <input
                          className="border rounded px-2 py-1.5 text-sm w-24 bg-white"
                          placeholder="Low"
                          value={draft.refChild[0]}
                          onChange={(e) => setDraft({ ...draft, refChild: [e.target.value, draft.refChild[1]] })}
                        />
                        <span className="text-slate-400">–</span>
                        <input
                          className="border rounded px-2 py-1.5 text-sm w-24 bg-white"
                          placeholder="High"
                          value={draft.refChild[1]}
                          onChange={(e) => setDraft({ ...draft, refChild: [draft.refChild[0], e.target.value] })}
                        />
                        <span className="text-xs text-slate-400">{draft.unit}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Specimen Container / Volume</label>
                  <input
                    className="border rounded px-2 py-1.5 text-sm w-full"
                    placeholder="e.g. 3mL EDTA tube"
                    value={draft.specimenContainer}
                    onChange={(e) => setDraft({ ...draft, specimenContainer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Synonyms (comma-separated)</label>
                  <input
                    className="border rounded px-2 py-1.5 text-sm w-full"
                    placeholder="e.g. Sugar, Glucose"
                    value={draft.synonyms}
                    onChange={(e) => setDraft({ ...draft, synonyms: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Notes</label>
                <textarea
                  className="border rounded px-2 py-1.5 text-sm w-full"
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  />
                  Active
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.searchVisible}
                    onChange={(e) => setDraft({ ...draft, searchVisible: e.target.checked })}
                  />
                  Search-visible (shows up in test pickers)
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.fastingRequired}
                    onChange={(e) => setDraft({ ...draft, fastingRequired: e.target.checked })}
                  />
                  Fasting required
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
              {saveStatus === "error" && <span className="text-xs text-red-600 mr-auto">Save failed — try again.</span>}
              <button onClick={closeModal} className="text-sm border border-slate-300 text-slate-600 px-3 py-1.5 rounded">
                Cancel
              </button>
              <button
                onClick={handleSaveTest}
                disabled={!draft.name.trim() || saveStatus === "saving"}
                className="text-sm bg-slate-800 disabled:bg-slate-300 text-white px-4 py-1.5 rounded"
              >
                {saveStatus === "saving" ? "Saving…" : draft.id ? "Save Changes" : "Add Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
