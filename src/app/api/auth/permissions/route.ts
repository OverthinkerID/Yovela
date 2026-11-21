import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, UserRole } from '../../../../lib/auth';

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  DOKTER: [
    'dashboard',
    'jadwal',
    'pasien',
    'antrean',
    'display-antrean',
    'poli',
    'satusehat',
    'stok',
    'kasir',
    'laporan',
    'pengeluaran',
  ],
  PENDAFTARAN: ['dashboard', 'jadwal', 'pasien', 'antrean', 'display-antrean', 'stok'],
  KASIR: ['dashboard', 'kasir', 'laporan'],
};

export async function GET() {
  const { errorResponse } = await requireAuth(['DOKTER', 'PENDAFTARAN', 'KASIR']);
  if (errorResponse) return errorResponse;

  const saved = await prisma.rolePermission.findMany();
  const map: Record<UserRole, string[]> = {
    DOKTER: [...DEFAULT_ROLE_PERMISSIONS.DOKTER],
    PENDAFTARAN: [...DEFAULT_ROLE_PERMISSIONS.PENDAFTARAN],
    KASIR: [...DEFAULT_ROLE_PERMISSIONS.KASIR],
  };

  for (const row of saved) {
    const r = row.role as UserRole;
    if (r in map) {
      try {
        const parsed = JSON.parse(row.permissionsJson);
        if (Array.isArray(parsed)) {
          map[r] = r === 'DOKTER' ? Array.from(new Set([...parsed, 'dashboard'])) : parsed;
        }
      } catch {}
    }
  }

  return NextResponse.json({ permissions: map });
}

export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireAuth(['DOKTER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const role = String(body.role || '') as UserRole;
    const permissions = Array.isArray(body.permissions) ? body.permissions.map(String) : null;

    if (!['DOKTER', 'PENDAFTARAN', 'KASIR'].includes(role) || !permissions) {
      return NextResponse.json({ error: 'Role dan daftar wewenang wajib diisi.' }, { status: 400 });
    }

    // Pastikan dashboard selalu aktif agar user tidak terkunci di halaman kosong
    const safePerms = Array.from(new Set(['dashboard', ...permissions]));

    await prisma.rolePermission.upsert({
      where: { role },
      update: { permissionsJson: JSON.stringify(safePerms) },
      create: { role, permissionsJson: JSON.stringify(safePerms) },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_ROLE_PERMISSIONS',
        entityType: 'RolePermission',
        entityId: role,
        metadataJson: JSON.stringify({ permissions: safePerms }),
      },
    });

    return NextResponse.json({ role, permissions: safePerms });
  } catch (err) {
    console.error('PATCH /api/auth/permissions error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan wewenang role.' }, { status: 500 });
  }
}
