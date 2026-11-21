import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';
import { serializePatientWithEncounter } from '../../../../lib/serializers';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.encounter.findUnique({
      where: { id },
      include: { patient: true, odontogram: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data kunjungan tidak ditemukan.' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (typeof body.statusKunjungan === 'string') {
      updateData.statusKunjungan = body.statusKunjungan;
    }

    // Pembaruan rekam medis (SOAP, E-Resep, Tindakan, Odontogram) hanya oleh DOKTER
    const isMedicalUpdate =
      body.subjective !== undefined ||
      body.objective !== undefined ||
      body.diagnosisIcd10 !== undefined ||
      body.suggestedTreatments !== undefined ||
      body.prescriptionNotes !== undefined ||
      body.odontogram !== undefined;

    if (isMedicalUpdate && user.role !== 'DOKTER') {
      return NextResponse.json(
        { error: 'Hanya Dokter yang dapat mengubah data rekam medis & odontogram.' },
        { status: 403 }
      );
    }

    if (body.statusKunjungan === 'Menunggu Pembayaran' && isMedicalUpdate) {
      if (body.diagnosisIcd10 !== undefined && !String(body.diagnosisIcd10).trim()) {
        return NextResponse.json({ error: 'Diagnosis ICD-10 wajib dipilih sebelum finalisasi ke kasir.' }, { status: 400 });
      }
      if (Array.isArray(body.suggestedTreatments) && body.suggestedTreatments.length === 0) {
        return NextResponse.json({ error: 'Pilih minimal 1 tindakan prosedur sebelum mengirim ke kasir.' }, { status: 400 });
      }
    }

    if (body.subjective !== undefined) updateData.subjective = String(body.subjective);
    if (body.objective !== undefined) updateData.objective = String(body.objective);
    if (body.diagnosisIcd10 !== undefined) updateData.diagnosisIcd10 = String(body.diagnosisIcd10);
    if (Array.isArray(body.suggestedTreatments)) {
      updateData.suggestedTreatmentsJson = JSON.stringify(body.suggestedTreatments);
    }
    if (body.prescriptionNotes !== undefined) {
      updateData.prescriptionNotes = String(body.prescriptionNotes);
    }
    if (user.role === 'DOKTER') {
      updateData.doctorId = user.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const enc = await tx.encounter.update({
        where: { id },
        data: updateData,
      });

      let odonto = existing.odontogram;
      if (body.odontogram !== undefined) {
        const teethJson = JSON.stringify(body.odontogram || {});
        const dmftD = Number(body.dmft?.d || 0);
        const dmftM = Number(body.dmft?.m || 0);
        const dmftF = Number(body.dmft?.f || 0);
        const dentitionType = String(body.dentitionType || 'adult');

        odonto = await tx.odontogramRecord.upsert({
          where: { encounterId: id },
          update: { teethJson, dmftD, dmftM, dmftF, dentitionType },
          create: {
            encounterId: id,
            patientId: existing.patientId,
            teethJson,
            dmftD,
            dmftM,
            dmftF,
            dentitionType,
          },
        });
      }

      const auditAction = isMedicalUpdate
        ? body.statusKunjungan === 'Menunggu Pembayaran'
          ? 'FINALIZE_EMR'
          : 'SAVE_DRAFT_EMR'
        : 'UPDATE_ENCOUNTER_STATUS';

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: auditAction,
          entityType: 'Encounter',
          entityId: id,
          metadataJson: JSON.stringify({ statusKunjungan: enc.statusKunjungan }),
        },
      });

      return { ...existing.patient, encounters: [{ ...enc, odontogram: odonto }] };
    });

    return NextResponse.json({
      patient: serializePatientWithEncounter(updated),
    });
  } catch (err) {
    console.error('PATCH /api/encounters/[id] error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui kunjungan pasien.' }, { status: 500 });
  }
}
