/**
 * FHIR R4 Bundle Adapter
 *
 * Imports standard FHIR R4 bundles directly into Ayura OS.
 * This supports systems that already export FHIR:
 *   - ABDM Health Information Exchange
 *   - OpenMRS with FHIR module
 *   - Epic / Cerner FHIR endpoints
 *   - Any FHIR-compliant EHR
 */

import fs from "fs/promises";
import { SourceAdapter, type AdapterConfig, type DiscoveredSchema } from "./base.js";
import { emptyDataset, type CanonicalDataset } from "../schema/canonical.js";
import { logger } from "../logger.js";

interface FhirAdapterOptions {
  /** Path to FHIR bundle JSON file(s) or directory */
  inputPath: string;
  /** FHIR server URL (alternative to file) */
  serverUrl?: string;
  /** Bearer token for FHIR server auth */
  authToken?: string;
}

interface FhirBundle {
  resourceType: "Bundle";
  type: string;
  entry?: FhirBundleEntry[];
}

interface FhirBundleEntry {
  resource: FhirResource;
}

interface FhirResource {
  resourceType: string;
  id?: string;
  [key: string]: unknown;
}

export class FhirAdapter extends SourceAdapter {
  private opts: FhirAdapterOptions;

  constructor(config: AdapterConfig) {
    super(config);
    this.opts = config.options as FhirAdapterOptions;
  }

  get displayName(): string {
    return this.opts.serverUrl
      ? `FHIR [${this.opts.serverUrl}]`
      : `FHIR [${this.opts.inputPath}]`;
  }

  async testConnection(): Promise<boolean> {
    if (this.opts.serverUrl) {
      try {
        const res = await fetch(`${this.opts.serverUrl}/metadata`, {
          headers: this.opts.authToken
            ? { Authorization: `Bearer ${this.opts.authToken}` }
            : {},
        });
        logger.success(`FHIR server reachable: ${res.status}`);
        return res.ok;
      } catch (err) {
        logger.error(`FHIR server unreachable`, { error: String(err) });
        return false;
      }
    }

    try {
      await fs.access(this.opts.inputPath);
      logger.success(`FHIR bundle file accessible`);
      return true;
    } catch {
      logger.error(`Cannot access FHIR input: ${this.opts.inputPath}`);
      return false;
    }
  }

  async discoverSchema(): Promise<DiscoveredSchema> {
    const bundle = await this.loadBundle();
    const resourceCounts = new Map<string, number>();

    for (const entry of bundle.entry || []) {
      const rt = entry.resource.resourceType;
      resourceCounts.set(rt, (resourceCounts.get(rt) || 0) + 1);
    }

    return {
      tables: Array.from(resourceCounts.entries()).map(([name, count]) => ({
        name,
        rowCount: count,
        columns: [], // FHIR resources are dynamic
      })),
    };
  }

  async extract(): Promise<CanonicalDataset> {
    logger.separator(`Extracting FHIR bundle`);

    const sourceSystem = this.config.sourceSystem || "fhir";
    const dataset = emptyDataset(sourceSystem);
    const bundle = await this.loadBundle();

    if (!bundle.entry || bundle.entry.length === 0) {
      logger.warn("Empty FHIR bundle");
      return dataset;
    }

    logger.info(`Processing ${bundle.entry.length} FHIR resources`);

    for (const entry of bundle.entry) {
      const resource = entry.resource;
      const id = resource.id || crypto.randomUUID();

      switch (resource.resourceType) {
        case "Patient":
          dataset.patients.push(this.mapPatient(resource, id, sourceSystem));
          break;

        case "Encounter":
          dataset.encounters.push(this.mapEncounter(resource, id, sourceSystem));
          break;

        case "MedicationRequest":
          dataset.medicationRequests.push(this.mapMedRequest(resource, id, sourceSystem));
          break;

        case "ServiceRequest":
          dataset.serviceRequests.push(this.mapServiceRequest(resource, id, sourceSystem));
          break;

        case "Observation":
          dataset.observations.push(this.mapObservation(resource, id, sourceSystem));
          break;

        case "Condition":
          dataset.conditions.push(this.mapCondition(resource, id, sourceSystem));
          break;

        case "AllergyIntolerance":
          dataset.allergies.push(this.mapAllergy(resource, id, sourceSystem));
          break;

        case "DiagnosticReport":
          dataset.diagnosticReports.push(this.mapDiagReport(resource, id, sourceSystem));
          break;

        default:
          logger.debug(`Skipping unsupported resource type: ${resource.resourceType}`);
      }
    }

    dataset.totalRecords =
      dataset.patients.length + dataset.encounters.length +
      dataset.medicationRequests.length + dataset.serviceRequests.length +
      dataset.observations.length + dataset.conditions.length +
      dataset.allergies.length + dataset.diagnosticReports.length;

    logger.success(`Extracted ${dataset.totalRecords} FHIR resources`);
    return dataset;
  }

  // ── FHIR → Canonical mappers ──────────────────────────────────

  private mapPatient(r: FhirResource, id: string, src: string) {
    const name = (r.name as any)?.[0];
    const telecom = (r.telecom as any[]) || [];
    const phone = telecom.find((t: any) => t.system === "phone")?.value || "";
    const email = telecom.find((t: any) => t.system === "email")?.value;
    const addr = (r.address as any)?.[0];

    return {
      _entity: "patient" as const,
      _sourceId: id,
      _sourceSystem: src,
      fullName: name ? `${name.given?.join(" ") || ""} ${name.family || ""}`.trim() : "Unknown",
      phone,
      email,
      dob: r.birthDate as string,
      gender: (r.gender as string) || "unknown",
      addressLine: addr?.line?.join(", "),
      city: addr?.city,
      state: addr?.state,
      pincode: addr?.postalCode,
      abhaId: (r.identifier as any[])?.find((i: any) =>
        i.system?.includes("abdm") || i.system?.includes("abha")
      )?.value,
    };
  }

  private mapEncounter(r: FhirResource, id: string, src: string) {
    const classMap: Record<string, string> = {
      AMB: "opd", IMP: "ipd", EMER: "emergency",
      VR: "tele", HH: "home",
    };

    return {
      _entity: "encounter" as const,
      _sourceId: id,
      _sourceSystem: src,
      patientSourceId: this.refId(r.subject),
      practitionerSourceId: this.refId((r.participant as any)?.[0]?.individual),
      class: classMap[(r.class as any)?.code] || "opd",
      status: (r.status as string) || "finished",
      reason: (r.reasonCode as any)?.[0]?.text,
      startedAt: (r.period as any)?.start || new Date().toISOString(),
      endedAt: (r.period as any)?.end,
    };
  }

  private mapMedRequest(r: FhirResource, id: string, src: string) {
    return {
      _entity: "medication_request" as const,
      _sourceId: id,
      _sourceSystem: src,
      patientSourceId: this.refId(r.subject),
      encounterSourceId: this.refId(r.encounter),
      prescriberSourceId: this.refId(r.requester),
      drugName: (r.medicationCodeableConcept as any)?.text || "Unknown",
      dosage: (r.dosageInstruction as any)?.[0]?.text,
      status: (r.status as string) || "completed",
      authoredAt: (r.authoredOn as string) || new Date().toISOString(),
    };
  }

  private mapServiceRequest(r: FhirResource, id: string, src: string) {
    return {
      _entity: "service_request" as const,
      _sourceId: id,
      _sourceSystem: src,
      patientSourceId: this.refId(r.subject),
      encounterSourceId: this.refId(r.encounter),
      requesterSourceId: this.refId(r.requester),
      code: (r.code as any)?.coding?.[0]?.code || "",
      display: (r.code as any)?.text || "",
      category: (r.category as any)?.[0]?.text || "lab",
      status: (r.status as string) || "completed",
      requestedAt: (r.authoredOn as string) || new Date().toISOString(),
    };
  }

  private mapObservation(r: FhirResource, id: string, src: string) {
    return {
      _entity: "observation" as const,
      _sourceId: id,
      _sourceSystem: src,
      patientSourceId: this.refId(r.subject),
      encounterSourceId: this.refId(r.encounter),
      code: (r.code as any)?.coding?.[0]?.code || "",
      codeSystem: (r.code as any)?.coding?.[0]?.system || "http://loinc.org",
      display: (r.code as any)?.text || "",
      valueNum: (r.valueQuantity as any)?.value,
      valueUnit: (r.valueQuantity as any)?.unit,
      valueText: (r.valueString as string) || (r.valueCodeableConcept as any)?.text,
      refLow: (r.referenceRange as any)?.[0]?.low?.value,
      refHigh: (r.referenceRange as any)?.[0]?.high?.value,
      status: (r.status as string) || "final",
      effectiveAt: (r.effectiveDateTime as string) || new Date().toISOString(),
    };
  }

  private mapCondition(r: FhirResource, id: string, src: string) {
    return {
      _entity: "condition" as const,
      _sourceId: id,
      _sourceSystem: src,
      patientSourceId: this.refId(r.subject),
      encounterSourceId: this.refId(r.encounter),
      code: (r.code as any)?.coding?.[0]?.code || "",
      display: (r.code as any)?.text || "",
      onsetAt: (r.onsetDateTime as string),
      resolvedAt: (r.abatementDateTime as string),
    };
  }

  private mapAllergy(r: FhirResource, id: string, src: string) {
    return {
      _entity: "allergy" as const,
      _sourceId: id,
      _sourceSystem: src,
      patientSourceId: this.refId(r.patient),
      substance: (r.code as any)?.text || "Unknown",
      reaction: (r.reaction as any)?.[0]?.manifestation?.[0]?.text,
      severity: (r.reaction as any)?.[0]?.severity,
    };
  }

  private mapDiagReport(r: FhirResource, id: string, src: string) {
    return {
      _entity: "diagnostic_report" as const,
      _sourceId: id,
      _sourceSystem: src,
      patientSourceId: this.refId(r.subject),
      encounterSourceId: this.refId(r.encounter),
      code: (r.code as any)?.coding?.[0]?.code || "",
      display: (r.code as any)?.text || "",
      status: (r.status as string) || "final",
      issuedAt: (r.issued as string),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────

  private refId(ref: unknown): string {
    if (!ref) return "";
    const refStr = (ref as any)?.reference || String(ref);
    // "Patient/123" → "123"
    return refStr.split("/").pop() || "";
  }

  private async loadBundle(): Promise<FhirBundle> {
    const content = await fs.readFile(this.opts.inputPath, "utf-8");
    const parsed = JSON.parse(content);

    if (parsed.resourceType === "Bundle") {
      return parsed as FhirBundle;
    }

    // Wrap a single resource or array in a bundle
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    return {
      resourceType: "Bundle",
      type: "collection",
      entry: entries.map((r: FhirResource) => ({ resource: r })),
    };
  }

  async close(): Promise<void> {
    // No connections to close
  }
}
