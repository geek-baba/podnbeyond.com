const MAX_BOOKING_RANGE_DAYS = parseInt(process.env.BOOKING_MAX_RANGE_DAYS || '365', 10);

function normalizeDate(date) {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

function getDateRange(checkIn, checkOut) {
  const start = normalizeDate(checkIn);
  const end = normalizeDate(checkOut);

  if (end <= start) {
    throw Object.assign(new Error('Check-out must be after check-in'), { statusCode: 400 });
  }

  const days = [];
  const cursor = new Date(start);
  let span = 0;

  while (cursor < end) {
    if (span > MAX_BOOKING_RANGE_DAYS) {
      throw Object.assign(new Error(`Stay cannot exceed ${MAX_BOOKING_RANGE_DAYS} nights`), { statusCode: 400 });
    }
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    span += 1;
  }
  return days;
}

function calculateSellable(baseAvailable, bufferPercent) {
  const percentMultiplier = 1 + (bufferPercent / 100);
  return Math.floor(baseAvailable * percentMultiplier);
}

function calculateFreeToSell(sellable, booked, holds) {
  return Math.max(0, sellable - booked - holds);
}

async function resolveBufferPercent(tx, property, roomTypeId, targetDate) {
  const date = new Date(targetDate);
  const dayOfWeek = date.getUTCDay();

  const rules = await tx.bufferRule.findMany({
    where: {
      propertyId: property.id,
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date },
      OR: [
        { roomTypeId: roomTypeId },
        { roomTypeId: null },
      ],
    },
    orderBy: [
      { roomTypeId: 'desc' },
      { updatedAt: 'desc' },
    ],
  });

  for (const rule of rules) {
    if (rule.roomTypeId && rule.roomTypeId !== roomTypeId) {
      continue;
    }

    if (rule.daysOfWeek) {
      const mask = rule.daysOfWeek.trim();
      let matches = true;
      if (/^[01]{7}$/.test(mask)) {
        const maskIndex = (dayOfWeek + 6) % 7;
        matches = mask[maskIndex] === '1';
      } else {
        const parts = mask.split(',').map((part) => part.trim().toLowerCase());
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        matches = parts.includes(weekdays[dayOfWeek]) || parts.includes(dayOfWeek.toString());
      }
      if (!matches) {
        continue;
      }
    }

    return rule.percent;
  }

  return property.defaultBuffer || 0;
}

async function ensureInventoryRow(tx, property, roomType, targetDate) {
  const date = normalizeDate(targetDate);
  const bufferPercent = await resolveBufferPercent(tx, property, roomType.id, date);
  const sellable = calculateSellable(roomType.baseRooms || 0, bufferPercent);

  try {
    const inventory = await tx.inventory.upsert({
      where: {
        roomTypeId_date: {
          roomTypeId: roomType.id,
          date,
        },
      },
      update: {},
      create: {
        propertyId: property.id,
        roomTypeId: roomType.id,
        date,
        baseAvailable: roomType.baseRooms || 0,
        bufferPercent,
        sellable,
        freeToSell: calculateFreeToSell(sellable, 0, 0),
      },
    });

    await tx.$queryRaw`SELECT id FROM "inventories" WHERE "id" = ${inventory.id} FOR UPDATE`;
    return tx.inventory.findUnique({ where: { id: inventory.id } });
  } catch (err) {
    if (err.code === 'P2002') {
      const existing = await tx.inventory.findUnique({
        where: {
          roomTypeId_date: {
            roomTypeId: roomType.id,
            date,
          },
        },
      });
      await tx.$queryRaw`SELECT id FROM "inventories" WHERE "id" = ${existing.id} FOR UPDATE`;
      return tx.inventory.findUnique({ where: { id: existing.id } });
    }
    throw err;
  }
}

async function updateInventoryWithHold(tx, inventory, roomsRequested, bookingId, holdToken) {
  const newHolds = inventory.holds + roomsRequested;
  const newFreeToSell = calculateFreeToSell(inventory.sellable, inventory.booked, newHolds);

  if (newFreeToSell < 0) {
    throw Object.assign(new Error('Not enough inventory to hold'), { code: 'INSUFFICIENT_INVENTORY' });
  }

  const updated = await tx.inventory.update({
    where: { id: inventory.id },
    data: {
      holds: newHolds,
      freeToSell: newFreeToSell,
      updatedAt: new Date(),
    },
  });

  await tx.inventoryLock.create({
    data: {
      inventoryId: inventory.id,
      bookingId,
      holdToken,
      change: roomsRequested,
      type: 'HOLD',
    },
  });

  await tx.inventoryAudit.create({
    data: {
      inventoryId: inventory.id,
      changeType: 'HOLD_CREATE',
      beforeState: {
        holds: inventory.holds,
        freeToSell: inventory.freeToSell,
      },
      afterState: {
        holds: updated.holds,
        freeToSell: updated.freeToSell,
      },
      reason: 'booking.hold',
    },
  });

  return updated;
}

async function updateInventoryWithConfirmation(tx, inventory, rooms, bookingId, holdToken, property) {
  const newHolds = Math.max(0, inventory.holds - rooms);
  const newBooked = inventory.booked + rooms;
  const overbookedRooms = Math.max(0, newBooked - inventory.sellable);
  const newFreeToSell = calculateFreeToSell(inventory.sellable, newBooked, newHolds);

  if (overbookedRooms > 0 && property && !property.overbookingEnabled) {
    throw Object.assign(new Error('Cannot overbook without buffer'), { code: 'OVERBOOK_LIMIT' });
  }

  const updated = await tx.inventory.update({
    where: { id: inventory.id },
    data: {
      holds: newHolds,
      booked: newBooked,
      overbooked: overbookedRooms,
      freeToSell: newFreeToSell,
      updatedAt: new Date(),
    },
  });

  await tx.inventoryLock.create({
    data: {
      inventoryId: inventory.id,
      bookingId,
      holdToken,
      change: rooms,
      type: 'BOOKED',
    },
  });

  await tx.inventoryAudit.create({
    data: {
      inventoryId: inventory.id,
      changeType: 'HOLD_CONFIRM',
      beforeState: {
        holds: inventory.holds,
        booked: inventory.booked,
        freeToSell: inventory.freeToSell,
      },
      afterState: {
        holds: updated.holds,
        booked: updated.booked,
        freeToSell: updated.freeToSell,
      },
      reason: 'booking.confirm',
    },
  });

  return updated;
}

async function releaseInventory(tx, inventory, rooms, bookingId, holdToken, status) {
  let newHolds = inventory.holds;
  let newBooked = inventory.booked;

  if (status === 'HOLD') {
    newHolds = Math.max(0, inventory.holds - rooms);
  } else if (status === 'CONFIRMED' || status === 'PENDING') {
    newBooked = Math.max(0, inventory.booked - rooms);
  }

  const newFreeToSell = calculateFreeToSell(inventory.sellable, newBooked, newHolds);
  const newOverbooked = Math.max(0, newBooked - inventory.sellable);

  const updated = await tx.inventory.update({
    where: { id: inventory.id },
    data: {
      holds: newHolds,
      booked: newBooked,
      overbooked: newOverbooked,
      freeToSell: newFreeToSell,
      updatedAt: new Date(),
    },
  });

  await tx.inventoryLock.create({
    data: {
      inventoryId: inventory.id,
      bookingId,
      holdToken,
      change: rooms,
      type: 'RELEASE',
    },
  });

  await tx.inventoryAudit.create({
    data: {
      inventoryId: inventory.id,
      changeType: 'HOLD_RELEASE',
      beforeState: {
        holds: inventory.holds,
        booked: inventory.booked,
        freeToSell: inventory.freeToSell,
      },
      afterState: {
        holds: updated.holds,
        booked: updated.booked,
        freeToSell: updated.freeToSell,
      },
      reason: 'booking.release',
    },
  });

  return updated;
}

module.exports = {
  normalizeDate,
  getDateRange,
  calculateSellable,
  calculateFreeToSell,
  resolveBufferPercent,
  MAX_BOOKING_RANGE_DAYS,
  ensureInventoryRow,
  updateInventoryWithHold,
  updateInventoryWithConfirmation,
  releaseInventory,
};

