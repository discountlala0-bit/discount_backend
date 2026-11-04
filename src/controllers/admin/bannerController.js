import { prisma } from '../../../lib/prisma.js';

function detectMediaType(url, explicitType) {
  if (explicitType && (explicitType === 'video' || explicitType === 'image')) {
    return explicitType;
  }
  if (!url || typeof url !== 'string') return 'image';
  const clean = url.toLowerCase().split('?')[0];
  if (
    clean.endsWith('.mp4') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.avi') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mkv') ||
    clean.endsWith('.m4v') ||
    url.includes('/video/upload/')
  ) {
    return 'video';
  }
  return 'image';
}

export const createBanner = async (req, res) => {
  try {
    const { image, media_type, booklet_ids, redirect_type, redirect_id, priority, status, type = 'popup' } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'Media URL/image is required' });
    }

    const mediaType = detectMediaType(image, media_type);

    let banner;
    try {
      banner = await prisma.banner.create({
        data: {
          image,
          mediaType,
          redirectType: redirect_type || 'none',
          redirectId: redirect_id || null,
          priority: priority !== undefined ? (parseInt(priority, 10) || 0) : 0,
          status: status || 'active',
        },
      });
    } catch (createErr) {
      try {
        banner = await prisma.banner.create({
          data: {
            image,
            redirectType: redirect_type || 'none',
            redirectId: redirect_id || null,
            priority: priority !== undefined ? (parseInt(priority, 10) || 0) : 0,
            status: status || 'active',
          },
        });
        await prisma.$executeRawUnsafe(`UPDATE "banners" SET "media_type" = '${mediaType}' WHERE "id" = '${banner.id}'`).catch(() => {});
        banner.mediaType = mediaType;
      } catch (rawErr) {
        const idRes = await prisma.$queryRawUnsafe(`SELECT gen_random_uuid()::text as id`);
        const id = idRes[0]?.id || Date.now().toString();
        await prisma.$executeRawUnsafe(`
          INSERT INTO "banners" ("id", "image", "media_type", "redirect_type", "redirect_id", "priority", "status", "type", "created_at", "updated_at")
          VALUES ('${id}', '${image}', '${mediaType}', '${redirect_type || 'none'}', ${redirect_id ? `'${redirect_id}'` : 'NULL'}, ${priority !== undefined ? (parseInt(priority, 10) || 0) : 0}, '${status || 'active'}', '${type}', NOW(), NOW())
        `);
        banner = {
          id,
          image,
          mediaType,
          redirectType: redirect_type || 'none',
          redirectId: redirect_id || null,
          priority: priority !== undefined ? (parseInt(priority, 10) || 0) : 0,
          status: status || 'active',
          type,
        };
      }
    }

    // Set type explicitly in DB
    await prisma.$executeRawUnsafe(`UPDATE "banners" SET "type" = '${type}' WHERE "id" = '${banner.id}'`).catch(() => {});
    banner.type = type;

    // Link target booklets
    if (Array.isArray(booklet_ids) && booklet_ids.length > 0) {
      try {
        await prisma.bannerBooklet.createMany({
          data: booklet_ids.map((bId) => ({
            bannerId: banner.id,
            bookletId: bId,
          })),
          skipDuplicates: true,
        });
      } catch (_) {
        for (const bId of booklet_ids) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "banner_booklets" ("id", "banner_id", "booklet_id")
            VALUES (gen_random_uuid()::text, '${banner.id}', '${bId}')
            ON CONFLICT ("banner_id", "booklet_id") DO NOTHING;
          `).catch(() => {});
        }
      }
    }

    let fullBanner = null;
    try {
      fullBanner = await prisma.banner.findUnique({
        where: { id: banner.id },
        include: {
          bannerBooklets: {
            include: {
              booklet: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });
    } catch (_) {
      fullBanner = banner;
    }

    res.status(201).json({ success: true, message: 'Banner created successfully', data: fullBanner || banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBanners = async (req, res) => {
  try {
    const { status, type } = req.query;

    const where = {};
    if (status) where.status = status;

    let banners;
    try {
      banners = await prisma.banner.findMany({
        where,
        include: {
          bannerBooklets: {
            include: {
              booklet: {
                select: { id: true, title: true },
              },
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (_) {
      try {
        banners = await prisma.banner.findMany({
          where,
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });
      } catch (__) {
        banners = await prisma.$queryRawUnsafe(`
          SELECT * FROM "banners" ${status ? `WHERE "status" = '${status}'` : ''} ORDER BY "priority" DESC, "created_at" DESC
        `).catch(() => []);
      }
      try {
        const allBannerBooklets = await prisma.$queryRawUnsafe(`
          SELECT bb.banner_id, bb.booklet_id, b.title as booklet_title
          FROM banner_booklets bb
          LEFT JOIN booklets b ON b.id = bb.booklet_id
        `);
        const map = {};
        for (const row of allBannerBooklets) {
          if (!map[row.banner_id]) map[row.banner_id] = [];
          map[row.banner_id].push({
            bookletId: row.booklet_id,
            booklet: { id: row.booklet_id, title: row.booklet_title }
          });
        }
        for (const b of banners) {
          b.bannerBooklets = map[b.id] || [];
        }
      } catch (___) {}
    }

    // Enrich with type from DB
    const typeMap = {};
    try {
      const types = await prisma.$queryRawUnsafe(`SELECT id, type FROM "banners"`);
      for (const r of types) {
        typeMap[r.id] = r.type || 'popup';
      }
    } catch (____) {}

    for (const b of banners) {
      if (!b.mediaType) b.mediaType = detectMediaType(b.image);
      b.viewsCount = b.viewsCount ?? b.views_count ?? 0;
      b.type = typeMap[b.id] || b.type || 'popup';
    }

    if (type) {
      banners = banners.filter((b) => b.type === type);
    }

    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    let banner;
    try {
      banner = await prisma.banner.findUnique({
        where: { id },
        include: {
          bannerBooklets: {
            include: {
              booklet: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });
    } catch (_) {
      banner = await prisma.banner.findUnique({ where: { id } });
    }

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, media_type, booklet_ids, redirect_type, redirect_id, priority, status, type } = req.body;

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    if (type !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE "banners" SET "type" = '${type}' WHERE "id" = '${id}'`).catch(() => {});
    }

    const mediaType = image ? detectMediaType(image, media_type) : (media_type || banner.mediaType);

    let updatedBanner;
    try {
      updatedBanner = await prisma.banner.update({
        where: { id },
        data: {
          ...(image && { image }),
          ...(mediaType && { mediaType }),
          ...(redirect_type !== undefined && { redirectType: redirect_type }),
          ...(redirect_id !== undefined && { redirectId: redirect_id }),
          ...(priority !== undefined && { priority: parseInt(priority, 10) || 0 }),
          ...(status && { status }),
        },
      });
    } catch (updateErr) {
      if (updateErr.message?.includes('mediaType')) {
        updatedBanner = await prisma.banner.update({
          where: { id },
          data: {
            ...(image && { image }),
            ...(redirect_type !== undefined && { redirectType: redirect_type }),
            ...(redirect_id !== undefined && { redirectId: redirect_id }),
            ...(priority !== undefined && { priority: parseInt(priority, 10) || 0 }),
            ...(status && { status }),
          },
        });
        if (mediaType) {
          await prisma.$executeRawUnsafe(`UPDATE "banners" SET "media_type" = '${mediaType}' WHERE "id" = '${id}'`).catch(() => {});
          updatedBanner.mediaType = mediaType;
        }
      } else {
        throw updateErr;
      }
    }

    if (booklet_ids !== undefined && Array.isArray(booklet_ids)) {
      try {
        await prisma.bannerBooklet.deleteMany({ where: { bannerId: id } });
        if (booklet_ids.length > 0) {
          await prisma.bannerBooklet.createMany({
            data: booklet_ids.map((bId) => ({
              bannerId: id,
              bookletId: bId,
            })),
            skipDuplicates: true,
          });
        }
      } catch (_) {
        await prisma.$executeRawUnsafe(`DELETE FROM "banner_booklets" WHERE "banner_id" = '${id}'`).catch(() => {});
        for (const bId of booklet_ids) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "banner_booklets" ("id", "banner_id", "booklet_id")
            VALUES (gen_random_uuid()::text, '${id}', '${bId}')
            ON CONFLICT ("banner_id", "booklet_id") DO NOTHING;
          `).catch(() => {});
        }
      }
    }

    let fullBanner = null;
    try {
      fullBanner = await prisma.banner.findUnique({
        where: { id },
        include: {
          bannerBooklets: {
            include: {
              booklet: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });
    } catch (_) {
      fullBanner = updatedBanner;
    }

    res.json({ success: true, message: 'Banner updated successfully', data: fullBanner || updatedBanner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    await prisma.banner.delete({ where: { id } });

    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
